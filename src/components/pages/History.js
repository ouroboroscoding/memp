/**
 * History
 *
 * Page to view the approves/declines
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-07-29
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect } from 'react';
import Parent from 'format-oc/Parent';
import Tree from 'format-oc/Tree';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Format Components
import { Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone, date, dateInc, datetime } from 'shared/generic/tools';

// Definitions
import TrackingDef from 'definitions/providers/tracking';
const ProviderTracking = clone(TrackingDef);
ProviderTracking.__react__ = {
	results: ['view', 'crm_id', 'customerName', 'action_ts', 'resolution', 'resolution_ts', 'time']
};
ProviderTracking.view = {__type__: 'string'}
ProviderTracking.action_ts.__react__ = {title: 'Started'}
ProviderTracking.resolution_ts.__react__ = {title: 'Resolved'}
ProviderTracking.time = {__type__: 'string', __react__: {title: 'Elapsed'}};
ProviderTracking.crm_id.__react__ = {title: 'Customer ID'};
ProviderTracking.customerName = {__type__: 'string', __react__: {title: 'Customer Name'}};

// Create the Tree
const TrackingTree = new Tree(ProviderTracking);

/**
 * History
 *
 * Returns breakdown of provider worked hours
 *
 * @name History
 * @extends React.Component
 */
export default function History(props) {

	// State
	let [range, rangeSet] = useState(null);
	let [results, resultsSet] = useState(false)

	// Refs
	let refStart = useRef();
	let refEnd = useRef();

	// Date range change
	useEffect(() => {
		if(range && props.user) {
			resultsFetch();
		} else {
			resultsSet(false);
		}
	// eslint-disable-next-line
	}, [range, props.user]);

	// Claim customer
	function claim(crm_id) {
		alert(crm_id);
	}

	// Converts the start and end dates into timestamps
	function rangeUpdate() {

		// Convert the start and end into timestamps
		let iStart = (new Date(refStart.current.value + ' 00:00:00')).getTime() / 1000;
		let iEnd = (new Date(refEnd.current.value + ' 23:59:59')).getTime() / 1000;

		// Set the new range
		rangeSet([iStart, iEnd]);
	}

	// Get the history by provider for the given start/end
	function resultsFetch() {

		// Fetch the results from the server
		Rest.read('providers', 'provider/tracking/viewed', {
			start: range[0],
			end: range[1],
			memo_id: props.user.id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we have data
			if(res.data) {
				resultsSet(res.data);
			}
		})
	}

	// Generate today date
	let sToday = date(new Date(), '-');

	// Render
	return (
		<Box id="history" className="page">
			<Box className="page_header">
				<Typography className="title">Approve/Decline History</Typography>
			</Box>
			<Box className="filter">
				<TextField
					defaultValue={date(dateInc(-14), '-')}
					inputRef={refStart}
					inputProps={{
						min: '2020-12-01',
						max: sToday
					}}
					label="Start"
					size="small"
					type="date"
					variant="outlined"
					InputLabelProps={{ shrink: true }}
				/>
				<Typography>-</Typography>
				<TextField
					defaultValue={sToday}
					inputRef={refEnd}
					inputProps={{
						min: '2020-12-01',
						max: sToday
					}}
					label="End"
					size="small"
					type="date"
					variant="outlined"
					InputLabelProps={{ shrink: true }}
				/>
				<Button
					color="primary"
					onClick={rangeUpdate}
					variant="contained"
				>Fetch</Button>
			</Box>
			{results && (
				results.length === 0 ?
					<Typography>No Results</Typography>
				:
					<Results
						custom={{
							customerName: v => {
								return v.claimed.customerName
							},
							view: v => {
								if(v.claimed.userId) {
									let sClaimedBy = v.claimed.userId === props.user.id ? 'You' : v.claimed.claimedBy;
									return `Customer claimed by ${sClaimedBy}`;
								} else {
									return <Button variant="contained" size="large" onClick={ev => claim(v.crm_id)}>View</Button>
								}
							}
						}}
						data={results}
						noun=""
						orderBy="action_ts"
						remove={false}
						service=""
						tree={TrackingTree}
						update={false}
					/>
				)
			}
		</Box>
	);
}

// Valid props
History.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.object.isRequired
}
