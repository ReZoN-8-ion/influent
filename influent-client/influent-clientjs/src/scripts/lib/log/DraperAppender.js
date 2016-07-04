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

aperture.log = (function(ns) {

    // Draper Activity Logger | Version 2.1.1

    // Workflow codes
    ns.draperWorkflow = {
        WF_OTHER       : 'WF_OTHER',
        WF_DEFINE      : 'WF_DEFINE',
        WF_GETDATA     : 'WF_GETDATA',
        WF_EXPLORE     : 'WF_EXPLORE',
        WF_CREATE      : 'WF_CREATE',
        WF_ENRICH      : 'WF_ENRICH',
        WF_TRANSFORM   : 'WF_TRANSFORM'
    };

    ns.draperType = {
        USER           : 'USERACTION',
        SYSTEM         : 'SYSACTION'
    };

	var DraperAppender = aperture.log.Appender.extend(
		{
			init: function(spec) {
				spec = spec || {};
				aperture.log.Appender.prototype.init.call(this, aperture.log.LEVEL.LOG);

				var logger = null;
				if (spec.address != null) {
					logger = new activityLogger(spec.webworker)
                        .echo(spec.echo)             // Echo logs to the console
                        .testing(spec.testing)       // Testing mode: don't send anything to spec.address
                        .registerActivityLogger(
                            spec.address,
                            'Influent',
                            '1.3.5'
                        );
				}
				this.draperLogger = logger;
			},

			logString : function(level, message) {
				if (this.draperLogger != null) {
					if (level === aperture.log.LEVEL.ERROR) {
						this.draperLogger.logSystemActivity('[' + level + '] ' + message);
					}
				}
			},

			logObjects : function(level, objectArray) {
				if (this.draperLogger != null) {
					if (level === aperture.log.LEVEL.LOG) {
						var logger = this.draperLogger;
						aperture.util.forEach(
							objectArray,
							function(object) {
                                    switch(object.type) {

                                        case ns.draperType.USER :
                                            logger.logUserActivity(
                                                object.description,
                                                object.activity,
												logger[object.workflow],
                                                object.data
                                            );
                                            break;
                                        case ns.draperType.SYSTEM :
                                            logger.logSystemActivity(
                                                object.description,
                                                object.data
                                            );
                                            break;
                                        default:
                                            break;
                                    }
							}
						);
					}
				}
			}
		}
	);

	/**
	 * @name aperture.log.addDraperAppender
	 * @function
	 * @description
	 * <p>Creates and adds a Draper appender object.
	 * The Draper Appender sends log messages to a provided end-point address
	 *
	 * @param {Object} spec specification object describing the properties of
	 * the Draper appender to build
	 *
	 * @returns {aperture.log.Appender} a new Draper appender object that has been added
	 * to the logging system
	 */
	ns.addDraperAppender = function(spec) {
		return ns.addAppender(new DraperAppender(spec));
	};

	return ns;

}(aperture.log || {}));
