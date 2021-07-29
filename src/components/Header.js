/**
 * Header
 *
 * Handles app bar and drawer
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-14
 */

// NPM modules
import React from 'react';
import { Link } from 'react-router-dom';

// Material UI
import Avatar from '@material-ui/core/Avatar';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AllInboxIcon from '@material-ui/icons/AllInbox';
//import CloseIcon from '@material-ui/icons/Close';
import CommentIcon from '@material-ui/icons/Comment';
import EventIcon from '@material-ui/icons/Event';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
import MenuIcon from '@material-ui/icons/Menu';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import NotificationImportantIcon from '@material-ui/icons/NotificationImportant';
import PermIdentityIcon from '@material-ui/icons/PermIdentity';
import PersonIcon from '@material-ui/icons/Person';
import SearchIcon from '@material-ui/icons/Search';

// Dialog components
import Account from './dialogs/Account';

// Data modules
import DsNotifications from 'data/ds_notifications';
import Claimed from 'data/claimed';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';
import TwoWay from 'shared/communication/twoway';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';
import PageVisibility from 'shared/generic/pageVisibility';
import { afindi, clone, empty, safeLocalStorageJSON } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

// Customer Item component
function CustomerItem(props) {

	// Click event
	function click(ev) {

		// Set the current ticket, even if it's null
		Tickets.current(props.ticket);

		// Let the parent know
		props.onClick(props);
	}

	// Render
	return (
		<React.Fragment>
			<Link to={Utils.path(props)} onClick={click}>
				<ListItem button selected={props.selected} className={!props.viewed ? 'transferred' : ''}>
					<ListItemAvatar>
						{props.newNotes ?
							<Avatar style={{backgroundColor: 'red'}}><NewReleasesIcon /></Avatar> :
							<Avatar><PersonIcon /></Avatar>
						}
					</ListItemAvatar>
					<ListItemText
						primary={props.customerName}
						secondary={
							<span className="customerDetails">
								<p>ID: {props.customerId}</p>
								{props.transferredBy &&
									<p>Transferrer: {props.transferredByName}</p>
								}
								<p>{props.type === 'view' ?
									'VIEW ONLY'
								:
									(props.continuous ? 'C-' : '') + props.type.toUpperCase() + ' ORDER'
								}</p>
							</span>
						}
					/>
				</ListItem>
			</Link>
		</React.Fragment>
	);
}

// Header component
export default class Header extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initialise the state
		this.state = {
			account: false,
			claimed: [],
			ds_notifications: 0,
			menu: false,
			newNotes: safeLocalStorageJSON('newNotes', {}),
			overwrite: Rights.has('prov_overwrite', 'create'),
			user: props.user || false,
		}

		// Timers
		this.iUpdates = null;

		// Bind methods to this instance
		this.accountToggle = this.accountToggle.bind(this);
		this.claimedAdd = this.claimedAdd.bind(this);
		this.claimedRemove = this.claimedRemove.bind(this);
		this.dsNotifications = this.dsNotifications.bind(this);
		this.menuClose = this.menuClose.bind(this);
		this.menuClick = this.menuClick.bind(this);
		this.menuItem = this.menuItem.bind(this);
		this.menuToggle = this.menuToggle.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
		this.signout = this.signout.bind(this);
		this.timeout = this.timeout.bind(this);
		this.visibilityChange = this.visibilityChange.bind(this);
		this.wsMessage = this.wsMessage.bind(this);
	}

	componentDidMount() {

		// Track any signedIn/signedOut events
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);
		Events.add('claimedAdd', this.claimedAdd);
		Events.add('claimedRemove', this.claimedRemove);
		Events.add('activitySignout', this.timeout);

		// Track document visibility
		PageVisibility.add(this.visibilityChange);

		// Track DS notifications count
		DsNotifications.subscribe(this.dsNotifications);
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
		Events.remove('claimedAdd', this.claimedAdd);
		Events.remove('claimedRemove', this.claimedRemove);
		Events.remove('activitySignout', this.timeout);

		// Track document visibility
		PageVisibility.remove(this.visibilityChange);

		// Stop tracking DS notifications count
		DsNotifications.unsubscribe(this.dsNotifications);

		// Stop checking for new messages and unclaimed counts
		if(this.iUpdates) {
			clearInterval(this.iUpdates);
			this.iUpdates = null;
		}
	}

	accountToggle() {
		this.setState({"account": !this.state.account});
	}

	claimedAdd(order) {

		// Clone the claimed state
		let lClaimed = clone(this.state.claimed);

		// Add the record to the end
		order.viewed = true;
		lClaimed.push(order);

		// Generate the path
		let sPath = Utils.path(order);

		// Create the new state
		let oState = {claimed: lClaimed}

		// Set the new state
		this.setState(oState);

		// Push the history
		this.props.history.push(sPath);
	}

	claimedFetch() {

		Claimed.fetch().then(data => {

			// Init new state
			let oState = {claimed: data};

			// If we're on a customer
			let lPath = Utils.parsePath(this.props.history.location.pathname);
			if(['ed', 'ed-c', 'view'].includes(lPath[0])) {

				// Look for the index of the claim
				let i = afindi(data, 'customerId', parseInt(lPath[1]))

				// If we can't find the customer we're on
				if(i === -1) {

					// Switch page
					this.props.history.push('/')
					Events.trigger('error', 'This customer is not claimed, switching to home.');
				}

				// Else, set the ticket
				else {
					Tickets.current(data[i].ticket);
				}
			}

			// Set the new path
			this.setState(oState, () => {

				// Look for new notes
				this.update();
			});

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	claimedRemove(customerId, switch_path) {

		// Find the index of the remove customer
		let iClaimed = afindi(this.state.claimed, 'customerId', customerId);

		// If we found one
		if(iClaimed > -1) {

			// Clone the claimed state
			let lClaimed = clone(this.state.claimed);

			// Remove the element
			lClaimed.splice(iClaimed, 1);

			// Create new instance of state
			let oState = {claimed: lClaimed}

			// If the path has switch
			if(switch_path) {
				this.props.history.push('/');
			}

			// If it's in the new notes
			if(customerId.toString() in this.state.newNotes) {
				let dNewNotes = clone(this.state.newNotes);
				delete dNewNotes[customerId];
				localStorage.setItem('newNotes', JSON.stringify(dNewNotes))
				oState.newNotes = dNewNotes;
			}

			// Set the new state
			this.setState(oState);
		}
	}

	dsNotifications(count) {
		this.setState({ds_notifications: count});
	}

	menuClose() {
		this.setState({menu: false});
	}

	menuClick(ev) {
		this.menuItem();
	}

	menuItem(customer=null) {

		// New state
		let state = {};

		// If we're in mobile, hide the menu
		if(this.props.mobile) {
			state.menu = false;
		}

		// If we clicked on a claimed id
		if(customer) {

			// Do we have a new notes flag for this customerId?
			if(customer.customerId in this.state.newNotes) {

				// Clone the new notes
				let dNewNotes = clone(this.state.newNotes);

				// Remove the corresponding key
				delete dNewNotes[customer.customerId];

				// Update the state
				state.newNotes = dNewNotes;

				// Store the new notes in local storage
				localStorage.setItem('newNotes', JSON.stringify(dNewNotes))
			}

			// Look for it in claimed
			let iIndex = afindi(this.state.claimed, 'customerId', customer.customerId);

			// If we have it, and it's a transfer
			if(iIndex > -1 && !this.state.claimed[iIndex].viewed) {

				// Clone the claims
				let lClaimed = clone(this.state.claimed);

				// Set the viewed flag
				lClaimed[iIndex].viewed = true;

				// Update the state
				state.claimed = lClaimed;

				// Tell the server
				Rest.update('monolith', 'order/claim/view', {
					customerId: customer.customerId
				}).done(res => {
					// If there's an error or warning
					if(res.error && !res._handled) {
						Events.trigger('error', Rest.errorMessage(res.error));
					}
					if(res.warning) {
						Events.trigger('warning', JSON.stringify(res.warning));
					}
				});
			}
		}

		// Set the new state
		this.setState(state);
	}

	menuToggle() {

		// Toggle the state of the menu
		this.setState({
			menu: !this.state.menu
		});
	}

	newNotes() {

		// Generate the list of customerIds
		let lIDs = this.state.claimed.map(o => o.customerId);

		// If we have none
		if(lIDs.length === 0) {
			return;
		}

		// Send the removal to the server
		Rest.read('monolith', 'notes/new', {
			customerIds: lIDs,
			ignore: this.state.user.id
		}, {"background": true}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// If there's any
				if(!empty(res.data)) {

					// Do we set the state?
					let bSetState = false;

					// Clone the current messages
					let dNewNotes = clone(this.state.newNotes);

					// Go through each one sent
					for(let sCustomerId in res.data) {

						// If we're on the customer's page
						if(this.props.history.location.pathname.indexOf('/'+sCustomerId+'/') > -1) {
							Events.trigger('newNotes');
						}

						// Else, if we don't already have this in newNotes
						else if(!(sCustomerId in dNewNotes)) {
							bSetState = true;
							dNewNotes[sCustomerId] = true;
						}
					}

					// If something changed
					if(bSetState) {

						// Store the new messages
						localStorage.setItem('newNotes', JSON.stringify(dNewNotes));

						// Set the new state
						this.setState({newNotes: dNewNotes});
					}

					// Notify
					Events.trigger('info', 'New Notes/SMS!');
				}
			}
		});
	}

	render() {

		// Create the drawer items
		let drawer = (
			<List style={{padding: 0}}>
				{this.state.user &&
					<React.Fragment>
						<Link to="/history" onClick={this.menuClick}>
							<ListItem button selected={this.props.history.location.pathname === "/history"}>
								<ListItemIcon><FormatListBulletedIcon /></ListItemIcon>
								<ListItemText primary="History" />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
				}
				{Rights.has('prov_templates', 'read') &&
					<React.Fragment>
						<Link to="/templates" onClick={this.menuClick}>
							<ListItem button selected={this.props.history.location.pathname === "/templates"}>
								<ListItemIcon><CommentIcon /></ListItemIcon>
								<ListItemText primary="Templates" />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
				}
				{Rights.has('calendly', 'read') &&
					<React.Fragment>
						<Link to="/appointments" onClick={this.menuClick}>
							<ListItem button selected={this.props.history.location.pathname === "/appointments"}>
								<ListItemIcon><EventIcon /></ListItemIcon>
								<ListItemText primary="Appointments" />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
				}
				{this.state.user.dsClinicianId &&
					<React.Fragment>
						<Link to="/dosespot" onClick={this.menuClick}>
							<ListItem button selected={this.props.history.location.pathname === "/dosespot"}>
								<ListItemIcon><NotificationImportantIcon /></ListItemIcon>
								<ListItemText primary={'DoseSpot' + (this.state.ds_notifications ? ' (' + this.state.ds_notifications + ')' : '')} />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
				}
				{this.state.user.eDFlag === 'Y' &&
					<React.Fragment>
						<Link to="/queue/ed" onClick={this.menuClick}>
							<ListItem button selected={this.props.history.location.pathname === "/queue/ed"}>
								<ListItemIcon><AllInboxIcon /></ListItemIcon>
								<ListItemText primary="ED New Orders" />
							</ListItem>
						</Link>
						<Divider />
						<Link to="/queue/ed/cont" onClick={this.menuClick}>
							<ListItem button selected={this.props.history.location.pathname === "/queue/ed/cont"}>
								<ListItemIcon><AllInboxIcon /></ListItemIcon>
								<ListItemText primary="ED Expiring" />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
				}
				<Link to="/search" onClick={this.menuClick}>
					<ListItem button selected={this.props.history.location.pathname === "/search"}>
						<ListItemIcon><SearchIcon /></ListItemIcon>
						<ListItemText primary="Search" />
					</ListItem>
				</Link>
				<Divider />
				{this.state.claimed.length > 0 && this.state.claimed.map((o,i) =>
					<CustomerItem
						key={i}
						newNotes={o.customerId in this.state.newNotes}
						onClick={this.menuItem}
						selected={this.props.history.location.pathname === Utils.path(o)}
						user={this.state.user}
						{...o}
					/>
				)}
			</List>
		);

		return (
			<div id="header">
				<div className="bar">
					{this.props.mobile &&
						<IconButton edge="start" color="inherit" aria-label="menu" onClick={this.menuToggle}>
							<MenuIcon />
						</IconButton>
					}
					<Typography className="title">
						<Link to="/" onClick={this.menuClick}>{this.props.mobile ? 'ME' : 'Male Excel Provider Portal'} {process.env.REACT_APP_VERSION}</Link>
					</Typography>
					{this.state.user &&
						<React.Fragment>
							<Tooltip title="Edit User">
								<IconButton onClick={this.accountToggle}>
									<PermIdentityIcon />
								</IconButton>
							</Tooltip>
							<Tooltip title="Sign Out">
								<IconButton onClick={this.signout}>
									<ExitToAppIcon />
								</IconButton>
							</Tooltip>
						</React.Fragment>
					}
				</div>
				{this.props.mobile ?
					<Drawer
						anchor="left"
						id="menu"
						open={this.state.menu}
						onClose={this.menuClose}
						variant="temporary"
					>
						{drawer}
					</Drawer>
				:
					<Drawer
						anchor="left"
						id="menu"
						open
						variant="permanent"
					>
						{drawer}
					</Drawer>
				}
				{this.state.account &&
					<Account
						onCancel={this.accountToggle}
						user={this.state.user}
					/>
				}
			</div>
		);
	}

	signedIn(user) {

		// Hide any modals and set the user
		this.setState({
			"overwrite": Rights.has('prov_overwrite', 'create'),
			"user": user
		}, () => {

			// Track user websocket messages
			TwoWay.track('monolith', 'user-' + user.id, this.wsMessage);

			// Fetch the claimed conversations
			this.claimedFetch();

			// Start checking for new messages
			this.iUpdates = setInterval(this.update.bind(this), 60000);
		});
	}

	signout(ev) {

		// Call the signout
		Rest.create('providers', 'signout', {}).done(res => {

			// If there's an error
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Reset the session
				Rest.session(null);

				// Trigger the signedOut event
				Events.trigger('signedOut');
			}
		});
	}

	// Called when the user signs out
	signedOut() {

		// Stop tracking user websocket messages
		TwoWay.untrack('monolith', 'user-' + this.state.user.id, this.wsMessage);

		// Hide and modals and set the user to false
		this.setState({
			"claimed": [],
			"overwrite": false,
			"user": false
		});

		// Stop checking for new notes
		if(this.iUpdates) {
			clearInterval(this.iUpdates);
			this.iUpdates = null;
		}
	}

	timeout(minutes) {

		// Call the signout
		Rest.create('providers', 'signout', {
			timeout: minutes * 60
		}).done(res => {

			// If there's an error
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Reset the session
				Rest.session(null);

				// Trigger the signedOut event
				Events.trigger('signedOut');
			}
		});
	}

	update() {
		this.newNotes();
	}

	// Current tab changed state from hidden/visible
	visibilityChange(property, state) {

		// If we've become visible
		if(state === 'visible') {

			// If we have a user
			if(this.state.user) {

				// Update
				this.update();

				// Start checking for new messages
				this.iUpdates = setInterval(this.update.bind(this), 60000);
			}
		}

		// Else if we're hidden
		else if(state === 'hidden') {

			// Stop checking for new messages and unclaimed counts
			if(this.iUpdates) {
				clearInterval(this.iUpdates);
				this.iUpdates = null;
			}
		}
	}

	// WebSocket message
	wsMessage(data) {

		// Move forward based on the type
		switch(data.type) {

			// If someone transferred a claim to us
			case 'claim_transfered':

				console.log('Claim transferred:', data.claim);

				// Clone the claims
				let lClaimed = clone(this.state.claimed);

				// Push the transfer to the top
				lClaimed.unshift(data.claim);

				// Save the state
				this.setState({
					claimed: lClaimed
				});

				// Notify the provider
				Events.trigger('info', 'A patient has been transferred to you');

				break;

			// If a claim was removed
			case 'claim_removed':

				// Look for the claim
				let iIndex = afindi(this.state.claimed, 'customerId', data.customerId);

				// If we found one
				if(iIndex > -1) {

					// Clone the claims
					let lClaimed = clone(this.state.claimed);

					// Delete the claim
					lClaimed.splice(iIndex, 1);

					// Set the new state
					this.setState({
						claimed: lClaimed
					});

					// If we're on the customer
					let lPath = Utils.parsePath(this.props.history.location.pathname);
					if(parseInt(lPath[1]) === data.customerId) {

						// Switch page
						this.props.history.push('/');
						Events.trigger('error', 'This customer is no longer claimed, switching to home.');
					}
				}
				break

			// Unknown type
			default:
				console.error('Unknown websocket message:', data);
				break;
		}
	}
}
