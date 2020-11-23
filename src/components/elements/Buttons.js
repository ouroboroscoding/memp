/**
 * Buttons
 *
 * Because MaterialUI is so terrible, we need an entire new component just to
 * make different coloured buttons
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-11-11
 */

// Material UI
import Button from '@material-ui/core/Button';
import { green, blueGrey } from '@material-ui/core/colors';
import { withStyles } from '@material-ui/core/styles';

export const GreenButton = withStyles((theme) => ({
	root: {
		color: 'white',
		backgroundColor: green[500],
		'&:hover': {
			backgroundColor: green[700],
		}
	}
}))(Button);

export const GreyButton = withStyles((theme) => ({
	root: {
		color: 'white',
		backgroundColor: blueGrey[500],
		'&:hover': {
			backgroundColor: blueGrey[700],
		}
	}
}))(Button);