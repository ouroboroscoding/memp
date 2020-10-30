/**
 * Queue
 *
 * Shows open ED/HRT/etc orders not claimed by any provider
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-19
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

// Composite components
import CustomerSummary from '../composites/CustomerSummary';

// Data modules
import claimed from '../../data/claimed';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';

// Local modules
import Utils from '../../utils';

// Queue component
export default class Queue extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			records: [],
			user: props.user
		}

		// Bind methods
		this.claim = this.claim.bind(this);
		this.fetch = this.fetch.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
	}

	componentDidMount() {

		// Track any signedIn/signedOut events
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);
		Events.add('Queue_' + this.props.type, this.fetch);

		// If we have a user
		if(this.state.user) {
			this.fetch();
		}
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
		Events.remove('Queue_' + this.props.type, this.fetch);
	}

	claim(order) {

		// Get the claimed add promise
		claimed.add(order.customerId, order.orderId).then(res => {
			Events.trigger('claimedAdd', order);
		}, error => {
			// If we got a duplicate
			if(error.code === 1101) {
				Events.trigger('error', 'Patient has already been claimed. Refreshing queue.');
				this.fetch();
			} else {
				Events.trigger('error', JSON.stringify(error));
			}
		});
	}

	fetch() {

		// Fetch the queue
		Rest.read('monolith', 'orders/pending/provider/' + this.props.type, {}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the state
				this.setState({
					records: res.data
				});
			}
		});
	}

	render() {
		return (
			<Box id="queue" className="page">
				<Box className="header">
					<Typography variant="h4">{this.state.records.length ? this.state.records.length + ' Pending' : 'No Pending'}</Typography>
				</Box>
				<Box className="summaries">
					{this.state.records.map((o,i) =>
						<CustomerSummary
							onClaim={this.claim}
							key={o.customerId}
							user={this.state.user}
							{...o}
						/>
					)}
				</Box>
			</Box>
		)
	}

	signedIn(user) {
		this.setState({
			user: user
		}, () => {
			this.fetch();
		})
	}

	signedOut() {
		this.setState({
			records: [],
			user: false
		});
	}
}

// Valid props
Queue.propTypes = {
	"type": PropTypes.oneOf(['ed', 'hrt']).isRequired
}
