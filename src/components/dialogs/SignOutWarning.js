/**
 * Sign Out Warning
 *
 * Handles showing the user a warning they will soon be signed out
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import Typography from '@material-ui/core/Typography';

/**
 * Sign Out Warning
 *
 * @name SignOutWarning
 * @access public
 * @param Object props Attributes passed to the component
 * @returns React.Component
 */
export default function SignOutWarning(props) {

	return (
		<Dialog
			disableBackdropClick
			maxWidth="lg"
			onClose={props.onClose}
			open={true}
			aria-labelledby="signout-warning-dialog-title"
		>
			<DialogTitle id="signout-warning-dialog-title">Sign Out Warning</DialogTitle>
			<DialogContent dividers>
				<Typography>
					Due to in-activity you will automatically be signed out of
					the portal in 60 seconds. Please click the button below if
					you wish to remain signed in.
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="primary" onClick={props.onClose}>
					Stay Signed In
				</Button>
			</DialogActions>
		</Dialog>
	);
}

// Valid props
SignOutWarning.propTypes = {
	onClose: PropTypes.func.isRequired
}
