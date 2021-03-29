/**
 * Account
 *
 * Handles showing and saving the user's account info
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */

// NPM modules
import Tree from 'format-oc/Tree'
import React, { useRef } from 'react';

// Material UI
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import Divider from '@material-ui/core/Divider';

// Format Components
import { Form } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

// Definitions
import PassDef from 'definitions/monolith/password';
import UserDef from 'definitions/monolith/user';

// Generate the Trees
const PassTree = new Tree(PassDef);
const UserTree = new Tree(UserDef);

// Override the react values
UserTree.special('react', {
	update: ['firstName', 'lastName', 'email', 'cellNumber', 'notificationPref', 'calendlyEmail']
})

// Account component
export default function Account(props) {

	let passForm = useRef();

	function passwordCheck(values) {
		if(values.new_passwd !== values.confirm_passwd) {
			Events.trigger('error', 'Passwords don\'t match');
			return false;
		}
		return values;
	}

	function passwordSuccess() {
		passForm.current.value = {
			passwd: '', new_passwd: '', confirm_passwd: ''
		};
	}

	function updateSuccess(user) {
		Rest.read('monolith', 'user', {}).done(res => {
			Events.trigger('signedIn', res.data);
		});
	}

	return (
		<Dialog
			maxWidth="lg"
			onClose={props.onCancel}
			open={true}
			aria-labelledby="confirmation-dialog-title"
		>
			<DialogTitle id="confirmation-dialog-title">Account Details</DialogTitle>
			<DialogContent dividers>
				<Form
					noun={"user"}
					sendPrimary={false}
					service="monolith"
					success={updateSuccess}
					tree={UserTree}
					type="update"
					value={props.user}
				/>
				<Divider />
				<br />
				<Form
					beforeSubmit={passwordCheck}
					errors={{1204: "Password not strong enough"}}
					noun={"user/passwd"}
					ref={passForm}
					success={passwordSuccess}
					service="monolith"
					tree={PassTree}
					type="update"
				/>
			</DialogContent>
		</Dialog>
	);
}
