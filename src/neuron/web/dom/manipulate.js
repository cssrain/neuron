/**
 * module  DOM/manipulate
 */
 
;(function(K, NULL, undef){

function cleanClass(str){
	return str.replace(/\s+/g, ' ');
};

function hasClass(el, cls){
	return el.className.indexOf(cls) !== -1;
};

function addClass(cls){
	var el = this;
	
	if(!hasClass(el, cls)){
		el.className = cleanClass( el.className + ' ' + cls );
	}
};

function removeClass(cls){
	this.className = this.className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1');
};


function getStorage(el){
	var id = SELECTOR.uid(el);

	return data_storage[id] || (data_storage[id] = {});
};


// clear data stored in element
// clear attributes
function cleanElement(el){
	var id = SELECTOR.uid(el),
		dom = new DOM(el);
		
	dom.detach();
	
	el.clearAttributes && el.clearAttributes();
	
	K.each(storage, function(s){
		delete s[id];
	});
};


/**
 * batch setter, single getter

 * data({a:1}) 	-> iterative setter
 * data('a', 1) -> setter
 * data('a')	-> getter
 
 @paran {number} getterArgLength
 
 <code:pseudo>
 - case 1:
 	getter:
		get('value')	-> arg[0] == String, arg.len == 1 == getterArgLength
 
	setter:
	 	set('value', 1)	-> 
		set({value: 1})	-> arg[0] != String, arg.len = 1 => arg.len >= getterArgLength
		
 - case 0:
 	getter:
 		value();		-> arg.len == 0 == getterArgLength
 	
 	setter:
 		value(1)		-> arg.len > 0 => arg.len >= getterArgLength
 		
 </code:pseudo>
 */
function overloadDOMGetterSetter(methods, getterArgLength){
	return function(){
		var context = this.context,
			args = arguments, 
			type, 
			len = args.length, 
			getter_len = getterArgLength,
			m;
		
		// getter	
		if(
			getter_len === len && 
			( getter_len === 0 || K.isString(args[0]) )
		){
			// getter only get the value of the first element
			return methods[GET].call(context[0], args[0])
			
		}else if(len >= getter_len){
			m = methods[SET];
		
			m && context.forEach(function(el){
				m.apply(el, args);
			});
		}
		
		return this;
	};
};


/**
 * @param {DOMElement|DOM} el native DOMElement or the instance of DOM
 * @return {DOMElement} native DOMElement(or the first context of DOM instance)
 */
function getFirstContext(element){
	element = (element instanceof DOM) ? element.el(0) : element;
	return element && element.nodeType ? element : false;
};


function getAllContexts(element){
	return (element instanceof DOM) ? element.context : K.makeArray(element).filter(function(el){
		return el && el.nodeType;
	});
};


function disposeElement(){
	var parent = this.parentNode;
	parent && parent.removeChild(this);
};

function emptyElement(){
	this.childNodes.forEach(disposeElement, this); // bind this
};

function grabElements(element, elements, where){
	elements = getAllContexts(elements);
	if(where === 'top'){
		elements = elements.reverse();
	}
	
	elements.forEach(function(el){
		el && inserters[where || 'bottom'](el, element);
	});
};


var DOM = K.DOM,

	GET = 'GET',
	SET = 'SET',
	SELECTOR = K.__SELECTOR,
	
	storage = DOM.__storage = {},
	
	data_storage = storage.data = {},
	
	TRUE = true,
	
	ATTR_CONVERT = {
		defaultvalue	: 'defaultValue',
		tabindex		: 'tabIndex',
		readonly		: 'readOnly',
		'for'			: 'htmlFor',
		'class'			: 'className',
		maxlength		: 'maxLength',
		cellspacing		: 'cellSpacing',
		cellpadding		: 'cellPadding',
		rowspan			: 'rowSpan',
		colspan			: 'colSpan',
		usemap			: 'useMap',
		frameborder		: 'frameBorder',
		contenteditable	: 'contentEditable',
		// type			: 'type',
		html			: 'innerHTML',
		text			: function(){
			var STR_TEXTCONTENT = 'textContent';
			
			// TODO: test if memleak
			return STR_TEXTCONTENT in document.createElement('div') ? STR_TEXTCONTENT : 'innerText';
		}()
	},
	
	ATTR_KEY = {
		html	: TRUE,
		text	: TRUE,
		'for'	: TRUE,
		'class'	: TRUE,
		type	: TRUE  // TODO: test readonly property
	},
	
	REGEX_IS_URI_ATTR = /^(?:href|src|usemap)$/i,
	
	ATTR_BOOLS = ['compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked', 'disabled', 'readOnly', 'multiple', 'selected', 'noresize', 'defer', 'defaultChecked'],
	
	ATTR = {},
	
	ATTR_METHODS = {
	
		// attribute setter
		SET: K._overloadSetter( function(name, value){
			var prop = ATTR_CONVERT[name] || name, el = this;
			
			name in ATTR_KEY ? el[prop] = value
				: ATTR_BOOLS.indexOf(prop) !== -1 ? el[prop] = !!value
					: el.setAttribute(prop, '' + value);
		}),
	
		// attribute getter
		// @return {string|boolean}
		GET: function(name){
			var prop = ATTR_CONVERT[name] || name,
				el = this, attrNode;
			
			return name in ATTR_KEY ? el[prop]
			
				// getAttribute(name, 2), return value as string
				// ref: http://msdn.microsoft.com/en-us/library/ms536429%28v=vs.85%29.aspx
				: ( REGEX_IS_URI_ATTR.test(prop) ? el.getAttribute(prop, 2)
				
					// ref: https://developer.mozilla.org/en/DOM/element.getAttributeNode
					: (attrNode = el.getAttributeNode(prop)) ? attrNode.nodeValue
						: NULL 
				  ) || NULL;
		}
	},
	
	DATA_METHODS = {
		SET: K._overloadSetter( function(name, value){
			var s = getStorage(this);
			s[name] = value;
		}),
		
		GET: function(name){
			var s = getStorage(this);
			return s[name];
		}
	},
	
	HTML_METHODS = {
	
		/**
		 * prevent using .set('html', '')
		 * use .empty() instead
		
		 * ref:
		 * Creating and Manipulating Tables: http://msdn.microsoft.com/en-us/library/ms532998%28v=vs.85%29.aspx
		 */
		SET: function(){
			var allow_table_innerHTML = false,
				table_test = document.createElement('table'),
				container = document.createElement('div'),
				WRAPPERS;
			
			try{
				table_test.innerHTML = '<tr><td></td></tr>';
				allow_table_innerHTML = true;
			}catch(e){}
			
			table_test = NULL;
			
			if(!allow_table_innerHTML){
			
				// in IE, which said by Microsoft: 
				// > However, because of the specific structure required by tables, 
				// > the innerText and innerHTML properties of the table and tr objects are read-only
				WRAPPERS = {
					table	: [1, '<table>', '</table>'],
					select	: [1, '<select>', '</select>'],
					tbody	: [2, '<table><tbody>', '</tbody></table>'],
					tr		: [3, '<table><tbody><tr>', '</tr></tbody></table>']
				};
				
				WRAPPERS.thead = WRAPPERS.tfoot = WRAPPERS.tbody;
			}
			
			return function(html){
				var el = this,
					wrapper = !allow_table_innerHTML && WRAPPERS[ el.tagName.toLowerCase() ];
					
				if(wrapper){
					var c = container, dimension = wrapper[0];
					c.innerHTML = wrapper[1] + html + wrapper[2];
					
					while(dimension --){
						c = c.firstChild;
					};
					
					emptyElement.call(el);
					grabElements(el, c.childNodes);
					
				}else{
					el.innerHTML = html
				}
			};
		}(),
		
		GET: function(){
			return this.innerHTML;
		}
	},
	
	TEXT_METHODS = {
		SET: function(text){
			emptyElement.call(this);
			this[ATTR_CONVERT.text] = text;
		},
		
		GET: function(){	
			return this[ATTR_CONVERT.text];
		}
	},
	
	inserters = {
		before: function(context, element){
			var parent = element.parentNode;
			parent && parent.insertBefore(context, element);
		},
	
		after: function(context, element){
			var parent = element.parentNode;
			parent && parent.insertBefore(context, element.nextSibling);
		},
	
		bottom: function(context, element){
			element.appendChild(context);
		},
	
		top: function(context, element){
			element.insertBefore(context, element.firstChild);
		}
	};


DOM.ATTR = ATTR;


DOM.extend({

	addClass: addClass,
	
	removeClass: removeClass,
	
	toggleClass: function(cls){
		var el = this;
		
		hasClass(el, cls) ? removeClass.call(el, cls) : addClass.call(el, cls);
	},
	
	removeData: function(name){
		if(name === undef){
			var id = SELECTOR.uid(this);
			id && delete data_storage[id]
		}else{
			var s = getStorage(this);
			delete s[name];
		}
	},
	
	removeAttr: function(name){
		var prop = ATTR_CONVERT[name], el = this;
			
			name in ATTR_KEY ? el[prop] = ''
				: ATTR_BOOLS.indexOf(prop) !== -1 ? el[prop] = false
					: self.removeAttribute(prop);
	},
	
	inject: function(element, where){
		element = getFirstContext(element);
		element && inserters[where || 'bottom'](this, element);
	},
	
	grab: function(elements, where){
		grabElements(this, elements, where);
	},
	
	dispose: disposeElement,
	
	empty: emptyElement
	
}, 'iterator'


).extend({
	hasClass: function(cls){
		return hasClass(this.context[0], cls);
	},
	
	match: function(selector){
		return SELECTOR.match(this.context[0], selector);
	},
	
	destroy: function(){
		var context = this.context;
		
		context.forEach(function(el){
			var elements = el.getElementsByTagName('*').push(el);
		
			children.forEach(cleanElement);
			disposeElement.call(el);
		});
		
		return NULL;
	},
	
	data: overloadDOMGetterSetter(DATA_METHODS, 1),
	attr: overloadDOMGetterSetter(ATTR_METHODS, 1),
	
	/**
	 * no api equivalent to set('html', '') in mootools
	 * use .empty() instead to prevent memleak
	 
	 * .html() is a getter
	 */
	html: overloadDOMGetterSetter(HTML_METHODS, 0),
	text: overloadDOMGetterSetter(TEXT_METHODS, 0)
});

})(KM, null);


/**
 change log:
 
 2011-09-07  Kael:
 - complete methods about attributes manipulation
 
 TODO:
 A. add .html(), .text() hook to .attr() method
 B. test readonly props
 C. test if memleak
 
 2011-09-05  Kael:
 - complete basic functionalities
 
 */