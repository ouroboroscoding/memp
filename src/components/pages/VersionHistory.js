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
	['0.1.0', 'October 14th, 2020', [
		'Development.'
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
