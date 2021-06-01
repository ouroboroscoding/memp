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

// Shared data modules
import DS from 'shared/data/dosespot';
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';
import Hash from 'shared/generic/hash';

// Shared hooks
import { useEvent } from 'shared/hooks/event';
import { useResize } from 'shared/hooks/resize';

// Composite component modules
import Alerts from 'components/Alerts';
import Header from 'components/Header';

// Dialogs
import NoUser from 'components/dialogs/NoUser';
import SignOutWarning from 'components/dialogs/SignOutWarning';

// Page component modules
import Appointments from 'components/pages/Appointments';
import DoseSpot from 'components/pages/DoseSpot';
import ED from 'components/pages/ED';
import ED_C from 'components/pages/ED-C';
import Queue from 'components/pages/Queue';
import QueueCont from 'components/pages/QueueCont';
import Search from 'components/pages/Search';
import Templates from 'components/pages/Templates';
import VersionHistory from 'components/pages/VersionHistory';
import View from 'components/pages/View';

// Local modules
import ActivityWatch from 'activityWatch';

// Rest
import 'rest_init';

// SASS CSS
import 'sass/site.scss';

// Init the activity watch with a 15 minute timer
ActivityWatch.init(15, {
	warning: () => Events.trigger('activityWarning'),
	signout: minutes => Events.trigger('activitySignout', minutes)
});

// Init the Hash module
Hash.init();

// Init tickets module
Tickets.init();

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
		DS.init(user.dsClinicianId);
	});
	useEvent('signedOut', () => {
		userSet(false);
		signoutWarningSet(false);
		ActivityWatch.stop();
		DS.init(0);
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
						<Route exact path="/dosespot">
							<DoseSpot user={user} />
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
