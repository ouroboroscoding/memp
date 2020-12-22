/**
 * Version History
 *
 * Displays the version history of the app
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-08-16
 */

// NPM modules
import React from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

const VERSION = [
	['1.3.0', 'December 22nd, 2020', [
		'Added ED Expiring queue for handling CED MIPs.'
	]],
	['1.2.0', 'December 15th, 2020', [
		'Added search page for looking up patients not awaiting approval and view all their info rather than just ED/HRT/etc.'
	]],
	['1.1.2', 'December 12th, 2020', [
		'Stopped allowing DoseSpot prescriptions that are "Entered" but not approved.',
		'Removed "ED Expiring Queue" which was still in development and should not have been in production.'
	]],
	['1.1.0', 'December 10th, 2020', [
		'Numerous fixes and tweaks after testing first release.',
		'Implemented tracking of all user activity.',
		'Implemented auto-signout if user is not using the app.'
	]],
	['1.0.0', 'November 26th, 2020', [
		'First release'
	]]
]

/**
 * Version History
 *
 * Wrapper for email and SMS templates
 *
 * @name VersionHistory
 * @extends React.Component
 */
export default function VersionHistory(props) {

	// Render
	return (
		<Box id="version" className="page">
			<Box className="content">
				<List>
					{VERSION.map(v =>
						<ListItem key={v[0]}>
							<ListItemText
								primary={"Version " + v[0] + ' - ' + v[1]}
								secondary={
									<ul>{v[2].map((s,i) => <li key={i}>{s}</li>)}</ul>
								}
							>
							</ListItemText>
						</ListItem>
					)}
				</List>
			</Box>
		</Box>
	);
}
