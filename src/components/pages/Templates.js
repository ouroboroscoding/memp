/**
 * Templates
 *
 * Created, edit, and delete templates used in auto-generating SMS messages
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-17
 */

// NPM modules
import Tree from 'format-oc/Tree'
import React, { useState, useEffect } from 'react';

// Material UI
//import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
//import Tab from '@material-ui/core/Tab';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
//import Tabs from '@material-ui/core/Tabs';
import Tooltip from '@material-ui/core/Tooltip';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';

// Format Components
import ResultsComponent from '../format/Results';
import FormComponent from '../format/Form';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// Definitions
import TemplateDef from '../../definitions/providers/template';

// Generate the template Trees
const TemplateTree = new Tree(TemplateDef);

/**
 * Templates
 *
 * Component to manage note/sms templates
 *
 * @name Templates
 * @access public
 * @param Object props Attributes sent to the component
 * @extends React.Component
 */
export default function Templates(props) {

	// State
	let [templates, templatesSet] = useState(null);
	let [create, createSet] = useState(false);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			fetch();
		} else {
			templatesSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	function createSuccess(template) {
		templatesSet(templates => {
			let ret = Tools.clone(templates);
			ret.unshift(template);
			return ret;
		});
		createSet(false);
	}

	// Toggle the create form
	function createToggle() {
		createSet(b => !b);
	}

	// Fetch all the templates from the server
	function fetch() {

		// Fetch all templates
		Rest.read('providers', 'templates', {}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the templates
				templatesSet(res.data);
			}
		});
	}

	// Remove a template
	function removeTemplate(_id) {

		// Use the current templates to set the new templates
		templatesSet(templates => {

			// Clone the templates
			let ret = Tools.clone(templates);

			// Find the index
			let iIndex = Tools.afindi(ret, '_id', _id);

			// If one is found, remove it
			if(iIndex > -1) {
				ret.splice(iIndex, 1);
			}

			// Return the new templates
			return ret;
		});
	}

	// Return the rendered component
	return (
		<Box id="templates" className="page">
			<Box className="templates">
				<Box className="pageHeader">
					<Box className="title">Templates</Box>
					{Utils.hasRight(props.user, 'prov_templates', 'create') &&
						<Tooltip title="Create new template">
							<IconButton onClick={createToggle}>
								<AddCircleIcon />
							</IconButton>
						</Tooltip>
					}
				</Box>
				{create &&
					<Paper className="padded">
						<FormComponent
							cancel={createToggle}
							noun="template"
							service="providers"
							success={createSuccess}
							title="Create New Template"
							tree={TemplateTree}
							type="create"
						/>
					</Paper>
				}
				{templates === null ?
					<Box>Loading...</Box>
				:
					<ResultsComponent
						data={templates}
						noun="template"
						orderBy="title"
						remove={Utils.hasRight(props.user, 'prov_templates', 'delete') ? removeTemplate : false}
						service="providers"
						tree={TemplateTree}
						update={Utils.hasRight(props.user, 'prov_templates', 'update')}
					/>
				}
			</Box>
			<Box className="legend">
				<Box className="subtitle">Legend</Box>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Variable</TableCell>
							<TableCell>Replacement</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell>{"{first_name}"}</TableCell>
							<TableCell>John</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>{"{last_name}"}</TableCell>
							<TableCell>Smith</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>{"{medications}"}</TableCell>
							<TableCell>100mg Sildenafil</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</Box>
		</Box>
	);
}
