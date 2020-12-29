/**
 * MIPs
 *
 * Shows list of MIPs based on requested form types
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-12-11
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

// MIP Types
import A1 from './A1';
import A2 from './A2';
import CED from './CED';

// Shared generic modules
import { clone } from 'shared/generic/tools';

/**
 * MIPs
 *
 * Fetches and displays MIPs based on requested forms
 *
 * @name MIPs
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function MIPs(props) {

	// State
	let [display, displaySet] = useState(props.forms.length ? {[props.forms[0].id]: true} : {});

	// Display or hide a MIP
	function mipToggle(id) {

		// Clone the display
		let oDisplay = clone(display);

		// If the mip is display
		if(id in oDisplay) {
			delete oDisplay[id];
		} else {
			oDisplay[id] = true;
		}

		// Set state
		displaySet(oDisplay);
	}

	// Render
	return (
		<Box>
			{props.forms.length === 0 ?
				<Box className="mip">
					<Box className="section header">
						<Typography className="title">No MIP(s) found for customer</Typography>
					</Box>
				</Box>
			:
				props.forms.map(o => {
					let Child = null;
					switch(o.form) {
						case 'MIP-A1': Child = A1; break;
						case 'MIP-A2': Child = A2; break;
						case 'MIP-CED': Child = CED; break;
						default: throw new Error('Invalid MIP form type');
					}
					return <Child
								display={display[o.id] || false}
								key={o.id}
								mobile={props.mobile}
								onChange={() => mipToggle(o.id)}
								oxytocin={props.oxytocin}
								{...o}
							/>
				})
			}
		</Box>
	);
}

// Valid props
MIPs.propTypes = {
	forms: PropTypes.arrayOf(PropTypes.object).isRequired,
	mobile: PropTypes.bool.isRequired,
	oxytocin: PropTypes.bool
}

// Default props
MIPs.defaultProps = {
	oxytocin: false
}
