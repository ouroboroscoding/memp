/**
 * Notes
 *
 * Handles fetching and displaying patient notes as either Notes or SMS
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-11-06
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import { afindi, clone } from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// Regex
const regTplVar = /{([^]+?)}/g

/**
 * Note
 *
 * Displays a single note
 *
 * @name Note
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
function Note(props) {

	let sClass = '';

	if(props.userRole === 'Doctor') {
		sClass = 'Outgoing Doctor';
	} else if(props.userRole === 'System') {
		sClass = 'Outgoing System';
	} else {
		sClass = 'Outgoing';
	}

	return (
		<Box className={"note " + sClass}>
			<Box className="action">
				{props.action}
			</Box>
			<Box className="content">
				{props.note.split('\n').map((s,i) =>
					<p key={i}>{s}</p>
				)}
			</Box>
			<Box className="footer">
				<span className="name">{props.createdBy} at </span>
				<span className="date">{props.createdAt}</span>
			</Box>
		</Box>
	);
}

/**
 * Message
 *
 * Displays a single SMS message
 *
 * @name Message
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
function Message(props) {

	// Get the type based on the action
	let type = props.action === 'Send Communication' ? 'Outgoing' : 'Incoming';

	// Pull out the actual content
	let content = props.note.split('[Content] ')[1];
	//if(!content) content = '';

	return (
		<Box className={"message " + type}>
			<Box className="content">
				{content.split('\n').map((s,i) =>
					<p key={i}>{s}</p>
				)}
			</Box>
			<Box className="footer">
				{type === 'Outgoing' &&
					<span>{props.createdBy} at </span>
				}
				<span>{props.createdAt}</span>
			</Box>
		</Box>
	);
}

/**
 * Notes
 *
 * Displays patient notes based on type, Notes or SMS
 *
 * @name Notes
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Notes(props) {

	// State
	let [notes, notesSet] = useState([]);
	let [templates, templatesSet] = useState([]);

	// Effect based on customer ID change
	useEffect(() => {
		fetchNotes();
		fetchTemplates()
		// eslint-disable-next-line
	}, [props.customerId]);

	// Effect on new notes
	useEffect(() => {
		scrollToBottom();
	}, [notes])

	// Effect on type change
	useEffect(() => {
		refInput.current.value = '';
	}, [props.type])

	// Refs
	let refScroll = useRef();
	let refInput = useRef();

	// Fetch all notes
	function fetchNotes() {

		// Find the Notes using the customer ID
		Rest.read('monolith', 'customer/notes', {
			customerId: props.customerId
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Set the notes
				notesSet(res.data.notes);
			}
		});
	}

	// Fetch all templates
	function fetchTemplates() {

		// Find the Notes using the customer ID
		Rest.read('providers', 'templates', {}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Set the notes
				templatesSet(res.data);
			}
		});
	}

	// Return only notes or sms
	function filterRecords(type) {

		// Init the return
		let lRet = [];

		// Init SMS types
		let lSMS = ['Send Communication', 'Receive Communication'];

		// Go through each record
		for(let o of notes) {

			// If we want notes
			if(type === 'notes') {
				if(lSMS.indexOf(o.action) === -1) {
					lRet.push(o);
				}
			}

			// Else, if we want sms messages
			else if(type === 'sms') {
				if(lSMS.indexOf(o.action) > -1) {
					lRet.push(o);
				}
			}
		}

		// Return what was found
		return lRet;
	}

	function filterTemplates(type) {

		// If type is notes
		if(type === 'notes') {
			type = 'note';
		}

		// Init the return
		let lRet = [];

		// Go through each record
		for(let o of templates) {

			// If the type matches, add it to the return
			if(o.type === type) {
				lRet.push(o);
			}
		}

		// Return what was found
		return lRet;
	}

	// Add a note to the patient's file
	function noteAdd(action) {

		// Get the content of the note
		let content = refInput.current.value;

		// If there's nothing, do nothing
		if(content.trim() === '') {
			return;
		}

		// Init the data
		let oData = {
			action: props.type === 'notes' ? 'Save Notes' : 'Send Communication',
			content: content,
			customerId: props.customerId
		}

		// Send the message to the server
		Rest.create('monolith', 'customer/note', oData).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				if(res.error.code === 1500) {
					Events.trigger('error', 'The customer has requested a STOP on all Provider SMS communications.');
				} else if(res.error.code === 1510) {
					Events.trigger('error', 'SMS Content is more than 1600 characters. Please split your message into multiple messages.');
				} else {
					Events.trigger('error', JSON.stringify(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we're ok
			if(res.data) {

				// Clear the note content
				refInput.current.value = '';

				// Copy the current state
				let lNotes = clone(notes);

				// Add the new one to the end
				lNotes.push({
					action: oData.action,
					note: oData.action === 'Send Communication' ? '[Content] ' + oData.content : oData.content,
					createdBy: 'You',
					createdAt: Utils.datetime(new Date()),
					userRole: 'Doctor'
				});

				// Set the new state
				notesSet(lNotes);
			}
		});
	}

	function scrollToBottom() {
		refScroll.current.scrollIntoView({ behavior: 'smooth' });
	}

	// Track any text enterered into an input box
	function textPress(event) {
		if(event.key === 'Enter') {
			noteAdd();
		}
	}

	function useTemplate(event) {

		// If we have no order
		if(!props.order) {
			Event.trigger('error', 'Can not use template without order data');
			return;
		}

		// If it's the first one, do nothing
		if(event.target.value === "-1") {
			return;
		}

		// Try to find the template index
		let iIndex = afindi(templates, '_id', event.target.value);

		// If it doesn't exist
		if(iIndex === -1) {
			Events.trigger('error', 'Template not found');
			return;
		}

		// Get the content
		let sContent = templates[iIndex].content;

		// Go through any template variables found
		for(let lMatch of sContent.matchAll(regTplVar)) {
			let sReplacement = null;
			switch(lMatch[1]) {
				case 'first_name':
					sReplacement = props.order.shipping.firstName;
					break;
				case 'last_name':
					sReplacement = props.order.shipping.lastName;
					break;
				case 'medications':
					sReplacement = props.order.items.map(o => o.description).join(', ')
					break;
				default:
					sReplacement = 'UNKNOWN VARIABLE "' + lMatch[1] + '"';
			}

			// If we found something, replace it
			if(sReplacement !== null) {
				sContent = sContent.replace(lMatch[0], sReplacement);
			}
		}

		// Fill the text field
		refInput.current.value = sContent;
	}

	// Figure out the class, filter, etc.
	let Child, iMax, sButton, sFilter;
	if(props.type === 'notes') {
		Child = Note;
		iMax = -1;
		sButton = 'Add Note';
		sFilter = 'notes';
	} else {
		Child = Message;
		iMax = 1600;
		sButton = 'Send';
		sFilter = 'sms';
	}

	// Render
	return (
		<Box id="notes">
			<Box className={sFilter}>
				{filterRecords(sFilter).map(note =>
					<Child
						key={note.id}
						{...note}
					/>
				)}
				<Box className="scroll" ref={refScroll} />
			</Box>
			<Box className="templates">
				<Select
					className='select'
					native
					onChange={useTemplate}
					variant="outlined"
				>
					<option key={-1} value={-1}>Use template...</option>
					{filterTemplates(sFilter).map((o,i) =>
						<option key={o._id} value={o._id}>{o.title}</option>
					)}
				</Select>
			</Box>
			<Box className="send">
				<TextField
					className="text"
					inputProps={{maxLength: iMax}}
					inputRef={refInput}
					multiline
					onKeyPress={textPress}
					rows={props.mobile ? 1 : 3}
					variant="outlined"
				/>
				<Button
					color="primary"
					size="large"
					onClick={noteAdd}
					variant="contained"
				>
					{sButton}
				</Button>
			</Box>
		</Box>
	);
}

// Valid props
Notes.propTypes = {
	customerId: PropTypes.string.isRequired,
	type: PropTypes.oneOf(['notes', 'sms']).isRequired
}
