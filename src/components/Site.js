/**
 * Site
 *
 * Primary entry into React app
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-14
 */

// NPM modules
import React, { useState } from 'react';
import { Switch, Route, useHistory } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';

// Generic modules
import Events from '../generic/events';
import Hash from '../generic/hash';
import Rest from '../generic/rest';

// Hooks
import { useSignedIn, useSignedOut } from '../hooks/user';
import { useResize } from '../hooks/resize';

// Composite component modules
import Alerts from './Alerts';
import Header from './Header';

// Dialogs
import NoUser from './dialogs/NoUser';

// Page component modules
import Appointments from './pages/Appointments';
import ED from './pages/ED';
import Queue from './pages/Queue';
import Templates from './pages/Templates';
import VersionHistory from './pages/VersionHistory';

// Local modules
import { LoaderHide, LoaderShow } from './Loader';

// css
import '../sass/site.scss';

// Init the rest services
Rest.init(process.env.REACT_APP_MEMS_DOMAIN, xhr => {

	// If we got a 401, let everyone know we signed out
	if(xhr.status === 401) {
		Events.trigger('error', 'You have been signed out!');
		Events.trigger('signedOut');
	} else {
		Events.trigger('error',
			'Unable to connect to ' + process.env.REACT_APP_MEMS_DOMAIN +
			': ' + xhr.statusText +
			' (' + xhr.status + ')');
	}
}, (method, url, data) => {
	LoaderShow();
}, (method, url, data) => {
	LoaderHide();
});

// If we have a session, fetch the user
if(Rest.session()) {
	Rest.read('providers', 'session', {}).done(res => {
		Rest.read('monolith', 'user', {}).done(res => {
			Events.trigger('signedIn', res.data);
		});
	});
}

// Make Events available from console
window.Events = Events;

// Hide the loader
LoaderHide();

// Init the Hash module
Hash.init();

// Site
export default function Site(props) {

	// State
	let [mobile, mobileSet] = useState(document.documentElement.clientWidth < 600 ? true : false);
	let [user, userSet] = useState(false);

	// Hooks
	let history = useHistory();

	// User hooks
	useSignedIn(user => userSet(user));
	useSignedOut(() => userSet(false));

	// Resize hooks
	useResize(() => mobileSet(document.documentElement.clientWidth < 600 ? true : false));

	// Return the Site
	return (
		<SnackbarProvider maxSnack={3}>
			<Alerts />
			<div id="site">
				{user === false &&
					<NoUser />
				}
				<Header
					history={history}
					mobile={mobile}
					path={window.location.pathname}
					user={user}
				/>
				<div id="content">
					<Switch>
						{/*<Route exact path="/templates">
							<Templates user={user} />
						</Route>*/}
						<Route exact path="/">
							<VersionHistory />
						</Route>
						<Route exact path="/templates">
							<Templates user={user} />
						</Route>
						<Route exact path="/appointments">
							<Appointments user={user} />
						</Route>
						<Route exact path="/queue/ed">
							<Queue
								key="ed"
								type="ed"
								user={user}
							/>
						</Route>
						<Route exact path="/queue/hrt">
							<Queue
								key="hrt"
								type="hrt"
								user={user}
							/>
						</Route>
						<Route
							exact
							path="/ed/:customerId/:orderId"
							children={
								<ED
									mobile={mobile}
									user={user}
								/>
							}
						/>
					</Switch>
				</div>
			</div>
		</SnackbarProvider>
	);
}
