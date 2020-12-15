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
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';

// Data modules
import DoseSpot from '../data/dosespot';

// Generic modules
import Events from '../generic/events';
import Hash from '../generic/hash';
import Rest from '../generic/rest';

// Hooks
import { useEvent } from '../hooks/event';
import { useResize } from '../hooks/resize';

// Composite component modules
import Alerts from './Alerts';
import Header from './Header';

// Dialogs
import NoUser from './dialogs/NoUser';
import SignOutWarning from './dialogs/SignOutWarning';

// Page component modules
import Appointments from './pages/Appointments';
import ED from './pages/ED';
import ED_C from './pages/ED-C';
import Queue from './pages/Queue';
import QueueCont from './pages/QueueCont';
import Search from './pages/Search';
import Templates from './pages/Templates';
import VersionHistory from './pages/VersionHistory';
import View from './pages/View';

// Local modules
import ActivityWatch from '../activityWatch';
import { LoaderHide, LoaderShow } from './Loader';

// css
import '../sass/site.scss';

// Init the activity watch with a 15 minute timer
ActivityWatch.init(15, {
	warning: () => Events.trigger('activityWarning'),
	signout: () => Events.trigger('activitySignout')
});

// Init the rest services
Rest.init(process.env.REACT_APP_MEMS_DOMAIN, process.env.REACT_APP_WS_DOMAIN, xhr => {

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
}, (method, url, data, opts) => {
	if(!opts.background) {
		ActivityWatch.reset();
		LoaderShow();
	}
}, (method, url, data, opts) => {
	if(!opts.background) {
		LoaderHide();
	}
});

// If we have a session, fetch the user
if(Rest.session()) {
	Rest.read('providers', 'session', {}).done(res => {
		if(res.error) {
			Rest.session(null);
		} else {
			let iAgent = res.data.user.agent;
			Rest.read('monolith', 'user', {}).done(res => {
				res.data.agent = iAgent;
				Events.trigger('signedIn', res.data);
			});
		}
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
	let [signoutWarning, signoutWarningSet] = useState(false);
	let [mobile, mobileSet] = useState(document.documentElement.clientWidth < 600 ? true : false);
	let [user, userSet] = useState(false);

	// Hooks
	let history = useHistory();
	let location = useLocation();

	// Event hooks
	useEvent('signedIn', user => {
		userSet(user);
		ActivityWatch.start();
		DoseSpot.init(user.dsClinicianId);
	});
	useEvent('signedOut', () => {
		userSet(false);
		signoutWarningSet(false);
		ActivityWatch.stop();
		DoseSpot.init(0);
	});
	useEvent('activityWarning', () => signoutWarningSet(true));

	// Resize hooks
	useResize(() => mobileSet(document.documentElement.clientWidth < 600 ? true : false));

	function staySignedIn() {
		signoutWarningSet(false);
		ActivityWatch.reset();
	}

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
						<Route exact path="/queue/ed/cont">
							<QueueCont
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
						<Route exact path="/queue/hrt/cont">
							<QueueCont
								key="hrt"
								type="hrt"
								user={user}
							/>
						</Route>
						<Route exact path="/search">
							<Search
								mobile={mobile}
								user={user}
							/>
						</Route>
						<Route
							exact
							path="/ed/:customerId/:orderId"
							children={
								<ED
									key={location.pathname}
									mobile={mobile}
									user={user}
								/>
							}
						/>
						<Route
							exact
							path="/ed-c/:customerId/:orderId"
							children={
								<ED_C
									key={location.pathname}
									mobile={mobile}
									user={user}
								/>
							}
						/>
						<Route
							exact
							path="/view/:customerId"
							children={
								<View
									key={location.pathname}
									mobile={mobile}
									user={user}
								/>
							}
						/>
					</Switch>
				</div>
			</div>
			{signoutWarning &&
				<SignOutWarning onClose={staySignedIn} />
			}
		</SnackbarProvider>
	);
}
