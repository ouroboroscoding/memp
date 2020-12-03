/**
 * MIP A1
 *
 * A1 ED MIP
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-11-03
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

// Element components
import { GreyButton } from '../../elements/Buttons';

// Local modules
import Utils from '../../../utils';

/**
 * A1
 *
 * Primary MIP type for ED customers
 *
 * @name ATwo
 * @access public
 * @param Object props Attributes sent to the component
 * @return Array
 */
export default function A1(props) {

	return (
		<Box className="mip">
			<Box className="section header">
				<Typography className="title">
					{props.form} - {Utils.niceDate(props.date, props.mobile ? 'short' : 'long')}
					<span> - <GreyButton variant="outlined" onClick={props.onChange}>{props.display ? 'Hide' : 'Display'}</GreyButton></span>
				</Typography>
			</Box>
			{props.display && props.questions.map(o =>
				<Box className="section">
					<Typography className="title">{o.title}</Typography>
					<Typography>{o.answer}</Typography>
				</Box>
			)}
		</Box>
	);
}

// Valid props
A1.propTypes = {
	date: PropTypes.string.isRequired,
	display: PropTypes.bool.isRequired,
	form: PropTypes.string.isRequired,
	mobile: PropTypes.bool.isRequired,
	onChange: PropTypes.func.isRequired,
	questions: PropTypes.array.isRequired
}
