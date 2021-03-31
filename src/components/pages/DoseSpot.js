/**
 * DoseSpot
 *
 * Displays the provider SSO page
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-03-30
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';

// Shared data modules
import DS from 'shared/data/dosespot';

// Shared generic modules
import Events from 'shared/generic/events';

/**
 * DoseSpot
 *
 * Wrapper for iframe
 *
 * @name DoseSpot
 * @extends React.Component
 */
export default function DoseSpot(props) {

	// State
	let [sso, ssoSet] = useState(false);

	// User effect
	useEffect(() => {
		if(props.user) {
			DS.providerSso().then(res => {
				ssoSet(res);
			}, error => {
				Events.trigger('error', JSON.stringify(error));
			});
		} else {
			ssoSet(false);
		}
	}, [props.user]);

	// Render
	return (
		<Box id="dosespot" className="page">
			{sso &&
				<iframe title="DoseSpot SSO" src={sso} />
			}
		</Box>
	);
}

// Valid types
DoseSpot.propTypes = {
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
