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
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

// Composite components
import CustomerSummary from '../composites/CustomerSummary';

// Data modules
import Claimed from 'data/claimed';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

// Queue component
export default function Queue(props) {

	// State
	let [records, recordsSet] = useState([]);

	// User effect
	useEffect(() => {

		// If we have a user
		if(props.user) {
			fetch();
		} else {
			recordsSet([]);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Mount effect
	useEffect(() => {
		Events.add('Queue_' + props.type, fetch);
		return () => Events.remove('Queue_' + props.type, fetch)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function claim(order) {

		// Get the claimed add promise
		Claimed.add(order.customerId, order.orderId).then(res => {
			Events.trigger('claimedAdd', order);
		}, error => {
			// If we got a duplicate
			if(error.code === 1101) {
				Events.trigger('error', 'Patient has already been claimed. Refreshing queue.');
				this.fetch();
			} else {
				Events.trigger('error', Rest.errorMessage(error));
			}
		});
	}

	function fetch() {

		// Fetch the queue
		Rest.read('monolith', 'orders/pending/provider/' + props.type, {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, set it
			if(res.data) {
				recordsSet(res.data);
			}
		});
	}

	return (
		<Box id="queue" className="page">
			<Box className="header">
				<Typography variant="h4">{records.length ? records.length + ' Pending' : 'No Pending'}</Typography>
			</Box>
			<Box className="summaries">
				{records.map((o,i) =>
					<CustomerSummary
						onClaim={claim}
						key={o.customerId}
						user={props.user}
						type={props.type}
						{...o}
					/>
				)}
			</Box>
		</Box>
	);
}

// Valid props
Queue.propTypes = {
	type: PropTypes.oneOf(['ed', 'hrt']).isRequired
}
