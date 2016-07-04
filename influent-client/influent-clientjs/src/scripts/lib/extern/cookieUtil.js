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
    [],
    function cookieUtil() {
        //
        // NOTE these utils were derived from the help page on http://www.quirksmode.org/js/cookies.html
        //

        var _createCookie = function(name,value,minutes) {
            var expires;
            if (minutes) {
                var date = new Date();
                date.setTime(date.getTime()+(minutes*60*1000));
                expires = '; expires=' + date.toGMTString();
            }
            else {
                expires = '';
            }
            document.cookie = name + '=' + value + expires + '; path=/';
        };

        var _readCookie = function(name) {
            var nameEQ = name + '=';
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        };

        var _eraseCookie = function(name) {
            _createCookie(name, '', -1);
        };

        return {
            createCookie : _createCookie,
            readCookie : _readCookie,
            eraseCookie : _eraseCookie
        };
    }
);
