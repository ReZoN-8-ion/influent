/*
 * Copyright 2013-2016 Uncharted Software Inc.
 *
 *  Property of Uncharted(TM), formerly Oculus Info Inc.
 *  https://uncharted.software/
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

define(
	[
		'lib/module', 'lib/communication/applicationChannels'
	],
	function(
			module, appChannel
		) {
		return {
			registerView : function(spec, sandbox) {
				aperture.pubsub.publish(appChannel.REGISTER_VIEW, spec);
			},
			select : function(viewModule) {
				if (!viewModule || !viewModule.name) {
					throw 'No view module provided to select or view module does not implement the \'name\' method';
				}
				// Fire a message that's picked up by infRouter that will try to select a route with the given name
				aperture.pubsub.publish(appChannel.SELECT_VIEW, {title:viewModule.name()});
			}
		};
	}
);

