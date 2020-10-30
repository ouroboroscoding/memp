/**
 * Signin
 *
 * Handles signing in
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-14
 */

// NPM modules
import React, { useRef, useState } from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Link from '@material-ui/core/Link';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';

// Local modules
import Utils from '../../../utils';

// Theme
const useStyles = makeStyles((theme) => ({
	forgot: {
		flexGrow: 1,
		textAlign: 'center',
	},
	dialog: {
		"& .MuiFormControl-root": {
			marginTop: '10px',
			width: '100%'
		}
	}
}));

// Sign In
export default function Signin(props) {

	// Styles
	const classes = useStyles();

	// State
	let [errors, errorsSet] = useState({})

	// Refs
	let userRef = useRef();
	let passRef = useRef();

	function fetchUser() {

		// Fetch the account data
		Rest.read('monolith', 'user', {}).done(res => {

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

				// Welcome user
				Events.trigger('success', 'Welcome!');

				// Trigger the signedIn event
				Events.trigger('signedIn', res.data);
			}
		});
	}

	function keyPressed(event) {
		if(event.key === 'Enter') {
			signin();
		}
	}

	function signin() {

		// Call the signin
		Rest.create('providers', 'signin', {
			"userName": userRef.current.value,
			"passwd": passRef.current.value
		}, false).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				switch(res.error.code) {
					case 1001:
						// Go through each message and mark the error
						let errors = {};
						for(let i in res.error.msg) {
							errors[i] = res.error.msg[i];
						}
						errorsSet(errors);
						break;
					case 1201:
						Events.trigger('error', 'User or password invalid');
						break;
					case 1503:
						Events.trigger('error', 'User marked as inactive');
						break;
					default:
						Events.trigger('error', JSON.stringify(res.error));
						break;
				}
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the session with the service
				Rest.session(res.data.session);

				// Fetch the user info
				fetchUser();
			}
		});
	}

	return (
		<React.Fragment>
			<DialogTitle id="confirmation-dialog-title">Sign In</DialogTitle>
			<DialogContent className={classes.dialog} dividers>
				<TextField
					error={errors.userName ? true : false}
					helperText={errors.userName || ''}
					inputRef={userRef}
					label="User"
					onKeyPress={keyPressed}
					type="text"
				/>
				<TextField
					error={errors.passwd ? true : false}
					helperText={errors.passwd || ''}
					inputRef={passRef}
					label="Password"
					onKeyPress={keyPressed}
					type="password"
				/>
			</DialogContent>
			<DialogActions>
				<div className={classes.forgot}>
					<Link color="secondary" href="#key=f">Forgot Password</Link>
				</div>
				<Button variant="contained" color="primary" onClick={signin}>
					Sign In
				</Button>
			</DialogActions>
		</React.Fragment>
	);
}
