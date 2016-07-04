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

define('templates/helpers/markupTerms', ['hbs/handlebars', 'templates/helpers/ellipsis'], function(Handlebars, ellipsis) {

	// escape special chars in text for html
	function escape(text) {
		return $('<div/>').text(text).html();
	}
	
	/**
	* Returns html representation of value text with css class markup of the terms specified.
	* Note that since this is a Handlebars helper and the result is html, the result should
	* use triple 'stashes instead of double: {{{markupTerms value terms cssClass}}}
	* 
	* @param value
	*	The value being subjected to markup in raw (non-html) form
	* @param terms
	*	The terms being marked as regular expressions or strings
	* @param cssClass
	*	The CSS class to mark with a span.
	* 
	* @returns
	*	An html value.
	*/
	function markupTerms(value, terms, cssClass, maxLength) {
		
		// skip out early if no terms.
		if (terms == null || terms.length === 0) {
			if (maxLength) {
				value= ellipsis.text(value, maxLength);
			}
			
			return escape(value);
		}

		// if not an array, make it one.
		if (!aperture.util.isArray(terms)) {
			terms = [terms];
		}

		
		var spans = [{unmatched : String(value)}];
		
		// process for each term in turn
		terms.forEach(function(term) {

			// skip out early if term is empty
			if (term.length === 0) {
				return;
			}

			// convert to regexp if a string.
			// escape all regexp flags, then allow any whitespace for any whitespace
			if (aperture.util.isString(term)) {
				term = new RegExp(
					term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // string to regex (escape flags)
						.replace(/\s/, '\\s'), // string to regex (any whitespace)
						'gi'); // all, case insensitive
			}
			
			var newSpans = [];

			// process spans.
			spans.forEach(function(span) {
				var text = span.unmatched,
					start = 0,
					match;
			
				if (text != null) {
					while ((match = term.exec(text)) !== null) {
						
						// if there is text preceding this match, add it.
						if (match.index > start) {
							newSpans.push({unmatched:text.substring(start, match.index)});
						}
						
						// then add the match
						newSpans.push({matched: match[0]});

						// then update the start of the next match
						start = match.index + match[0].length;
					}
					
					// when done check for tail
					if (start < text.length) {
						newSpans.push({unmatched: text.substr(start)});
					}

				// if already a match just push it along
				} else {
					newSpans.push(span);
				}
			});
			
			spans = newSpans;
			
		});

		var markup = '',
			spanTag = '<span class="'+ cssClass + '">';

		// now mark it up
		spans.forEach(function(span) {
			if (span.matched) {
				markup += spanTag + escape(span.matched) + '</span>';
			} else {
				markup += escape(span.unmatched);
			}
		});
		
		if (maxLength) {
			markup= ellipsis.html(markup, maxLength);
		}
		
		return markup;
	}

	Handlebars.registerHelper('markupTerms', markupTerms);
	
	return markupTerms;
});
