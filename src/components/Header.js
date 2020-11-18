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
import CloseIcon from '@material-ui/icons/Close';
import CommentIcon from '@material-ui/icons/Comment';
import EventIcon from '@material-ui/icons/Event';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import ForumIcon from '@material-ui/icons/Forum';
import MenuIcon from '@material-ui/icons/Menu';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import PermIdentityIcon from '@material-ui/icons/PermIdentity';

// Dialog components
import Account from './dialogs/Account';

// Data modules
import claimed from '../data/claimed';

// Generic modules
import Events from '../generic/events';
import Rest from '../generic/rest';
import Tools from '../generic/tools';

// Local modules
import TwoWay from '../twoway';
import Utils from '../utils';

// Customer Item component
function CustomerItem(props) {

	// Click event
	function click(event) {
		props.onClick(props);
	}

	// X click
	function remove(event) {

		// Stop all propogation of the event
		if(event) {
			event.stopPropagation();
			event.preventDefault();
		}

		// Send the request to the server
		claimed.remove(props.customerId, 'rejected').then(() => {
			// Trigger the claimed being removed
			Events.trigger('claimedRemove', props.customerId, props.selected);
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		});
	}

	// Render
	return (
		<React.Fragment>
			<Link to={Utils.orderPath(props)} onClick={click}>
				<ListItem button selected={props.selected}>
					<ListItemAvatar>
						{props.newMsgs ?
							<Avatar style={{backgroundColor: 'red'}}><NewReleasesIcon /></Avatar> :
							<Avatar><ForumIcon /></Avatar>
						}
					</ListItemAvatar>
					<ListItemText
						primary={props.customerName}
						secondary={
							<React.Fragment>
								<span>
									ID: {props.customerId}<br/>
								</span>
								<span className="customerActions">
									<span className="tooltip">
										<Tooltip title="Remove Claim">
											<IconButton className="close" onClick={remove}>
												<CloseIcon />
											</IconButton>
										</Tooltip>
									</span>
								</span>
							</React.Fragment>
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
			menu: false,
			newMsgs: {},
			overwrite: props.user ? Utils.hasRight(props.user, 'prov_overwrite', 'create') : false,
			path: window.location.pathname,
			user: props.user || false,
		}

		// Bind methods to this instance
		this.accountToggle = this.accountToggle.bind(this);
		this.claimedAdd = this.claimedAdd.bind(this);
		this.claimedRemove = this.claimedRemove.bind(this);
		this.menuClose = this.menuClose.bind(this);
		this.menuClick = this.menuClick.bind(this);
		this.menuItem = this.menuItem.bind(this);
		this.menuToggle = this.menuToggle.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
		this.signout = this.signout.bind(this);
		this.wsMessage = this.wsMessage.bind(this);
	}

	componentDidMount() {

		// Track any signedIn/signedOut events
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);
		Events.add('claimedAdd', this.claimedAdd);
		Events.add('claimedRemove', this.claimedRemove);
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
		Events.remove('claimedAdd', this.claimedAdd);
		Events.remove('claimedRemove', this.claimedRemove);
	}

	accountToggle() {
		this.setState({"account": !this.state.account});
	}

	claimedAdd(order) {

		// Clone the claimed state
		let lClaimed = Tools.clone(this.state.claimed);

		// Add the record to the end
		lClaimed.push(order);

		// Generate the path
		let sPath = Utils.orderPath(order);

		// Create the new state
		let oState = {
			claimed: lClaimed,
			path: sPath
		}

		// Set the new state
		this.setState(oState);

		// Push the history
		this.props.history.push(sPath);
	}

	claimedFetch() {

		claimed.fetch().then(data => {

			// Init new state
			let oState = {claimed: data};

			// If we're on a customer
			let lPath = Utils.parsePath(this.state.path);
			if(lPath[0] === 'customer') {

				// If we can't find the customer we're on
				if(Tools.afindi(data, 'customerId', parseInt(lPath[1])) === -1) {

					// Switch page
					this.props.history.push('/')
					Events.trigger('error', 'This customer is not claimed, switching to home.');
				}
			}

			// Set the new path
			this.setState(oState);

		}, error => {
			Events.trigger('error', JSON.stringify(error));
		});
	}

	claimedRemove(customerId, switch_path) {

		// Find the index of the remove customer
		let iClaimed = Tools.afindi(this.state.claimed, 'customerId', customerId);

		// If we found one
		if(iClaimed > -1) {

			// Clone the claimed state
			let lClaimed = Tools.clone(this.state.claimed);

			// Remove the element
			let oClaim = lClaimed.splice(iClaimed, 1)[0];

			// Create new instance of state
			let oState = {claimed: lClaimed}

			// If the path has switch
			if(switch_path) {
				oState.path = '/queue/' + oClaim.type;
				this.props.history.push(oState.path);
			}

			// If it's in the new messages
			if(customerId.toString() in this.state.newMsgs) {
				let dNewMsgs = Tools.clone(this.state.newMsgs);
				delete dNewMsgs[customerId];
				localStorage.setItem('newMsgs', JSON.stringify(dNewMsgs))
				oState.newMsgs = dNewMsgs;
			}

			// Set the new state
			this.setState(oState);
		}
	}

	menuClose() {
		this.setState({menu: false});
	}

	menuClick(event) {
		this.menuItem(
			event.currentTarget.pathname,
			event.currentTarget.dataset.number
		);
	}

	menuItem(order) {

		// New state
		let state = {
			path: Utils.orderPath(order)
		};

		// If we're in mobile, hide the menu
		if(this.props.mobile) {
			state.menu = false;
		}

		// If we clicked on a claimed id
		if(state.path.indexOf(order.orderId) > -1) {

			// Look for it in claimed
			let iIndex = Tools.afindi(this.state.claimed, 'customerId', order.customerId);

			// If we have it, and it's a transfer
			if(iIndex > -1 && this.state.claimed[iIndex].transferredBy) {

				// Clone the claims
				let lClaimed = Tools.clone(this.state.claimed);

				// Remove the transferredBy
				lClaimed[iIndex].transferredBy = null;

				// Update the state
				state.claimed = lClaimed;

				// Tell the server
				Rest.update('monolith', 'order/claim/clear', {
					customerId: order.customerId
				}).done(res => {
					// If there's an error or warning
					if(res.error && !Utils.restError(res.error)) {
						Events.trigger('error', JSON.stringify(res.error));
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

	render() {

		// Create the drawer items
		let drawer = (
			<List style={{padding: 0}}>
				{Utils.hasRight(this.state.user, 'prov_templates', 'read') &&
					<React.Fragment>
						<Link to="/templates" onClick={this.menuClick}>
							<ListItem button selected={this.state.path === "/templates"}>
								<ListItemIcon><CommentIcon /></ListItemIcon>
								<ListItemText primary="Templates" />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
				}
				{Utils.hasRight(this.state.user, 'calendly', 'read') &&
					<React.Fragment>
						<Link to="/appointments" onClick={this.menuClick}>
							<ListItem button selected={this.state.path === "/appointments"}>
								<ListItemIcon><EventIcon /></ListItemIcon>
								<ListItemText primary="Appointments" />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
				}
				{this.state.user.eDFlag === 'Y' &&
					<Link to="/queue/ed" onClick={this.menuClick}>
						<ListItem button selected={this.state.path === "/queue/ed"}>
							<ListItemIcon><AllInboxIcon /></ListItemIcon>
							<ListItemText primary="ED Queue" />
						</ListItem>
					</Link>
				}
				{this.state.user.hormoneFlag === 'Y' &&
					<Link to="/queue/hrt" onClick={this.menuClick}>
						<ListItem button selected={this.state.path === "/queue/hrt"}>
							<ListItemIcon><AllInboxIcon /></ListItemIcon>
							<ListItemText primary="HRT Queue" />
						</ListItem>
					</Link>
				}
				{this.state.claimed.length > 0 &&
					<React.Fragment>
						<Divider />
						{this.state.claimed.map((o,i) =>
							<CustomerItem
								key={i}
								onClick={this.menuItem}
								selected={this.state.path === Utils.orderPath(o)}
								user={this.state.user}
								{...o}
							/>
						)}
					</React.Fragment>
				}
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
						<Link to="/" onClick={this.menuClick}>{this.props.mobile ? 'ME' : 'Male Excel Provider Portal'}</Link>
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
			"overwrite": Utils.hasRight(user, 'prov_overwrite', 'create'),
			"user": user
		}, () => {

			// Track user websocket messages
			TwoWay.track('monolith', 'user-' + user.id, this.wsMessage);

			// Fetch the claimed conversations
			this.claimedFetch();
		});
	}

	signout(ev) {

		// Call the signout
		Rest.create('providers', 'signout', {}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
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
	}

	// WebSocket message
	wsMessage(data) {

		// Move forward based on the type
		switch(data.type) {

			// If someone transferred a claim to us
			case 'claim_transfered':

				// Clone the claims
				let lClaimed = Tools.clone(this.state.claimed);

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
				let iIndex = Tools.afindi(this.state.claimed, 'customerId', data.customerId);

				// If we found one
				if(iIndex > -1) {

					// Clone the claims
					let lClaimed = Tools.clone(this.state.claimed);

					// Delete the claim
					lClaimed.splice(iIndex, 1);

					// Set the new state
					this.setState({
						claimed: lClaimed
					});

					// If we're on a customer
					let lPath = Utils.parsePath(this.state.path);
					if(lPath[0] === 'order') {

						// If it's the one removed
						if(parseInt(lPath[1]) === data.customerId) {

							// Switch page
							this.props.history.push('/');
							Events.trigger('error', 'This customer is not claimed, switching to home.');
						}
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
