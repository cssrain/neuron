/**
 * module  oop/class
 * author  Kael Zhang
 
 * unlike mootools
	- new KM.Class will return a pure javascript constructor
	- new KM.Class could inherit from a pure javascript constructor
 */


;(function(K){

/**
 relevant javascript reserved words:

 extends
 implements

 */


/**
 Implements: 
 	- classes implemented, constructor and destructor will not be inherited
 	- destructor methods will be ignored
 	- implementing A will not make A instantiated
 
 Extends: 
	X - destructor methods will be collected

var Class = KM.Class,

	myClass = Class( baseClass, {
		Extends: [ Interface1, Interface2, 'options' ],
		// Extends: 'options events',
		
		initialize: function(){},
		
		__destruct: function(){},
		
		method: function(){}
	}),

	instance = new myClass();


Class.destroy(instance);
*/


function getPrototype(obj){
	var ret, type = K._type(obj);
	
	if(type === 'function'){
		ret = obj.prototype;
	}else if(type === 'object'){
		ret = obj;
	}else if(type === 'string'){
		ret = getPrototype(EXTS[obj.toLowerCase()]);
	}
	
	return ret;
};


function implementOne(host, alien){
	var proto = getPrototype(alien);

	proto && K.mix(
		host, 
		K.clone(proto),
		// K.clone(proto, function(value, key){
		//	return PRIVATE_MEMBERS.indexOf(key) === -1;
		// }),
		
		// methods of an interface have lowest priorities
		false
	);
};


// implement a class with interfaces
function implement(host, extensions){
	if(typeof extensions === 'string'){
		extensions = extensions.trim().split(/\s+/);
	}

	K.makeArray(extensions).forEach(function(alien){
		implementOne(this, alien);
	}, host.prototype);
};


function isPublicMember(key){
	return PRIVATE_MEMBERS.indexOf(key) === -1;
};


function setAttrs(class_, attr){
	var attrs = [], parent_attr, cls = class_;

	while(cls = cls.prototype[__SUPER_CLASS]){
		if(parent_attr = cls.ATTRS){
			attrs.push(parent_attr);
		}
	}
	
	attrs.forEach(function(a){
		K.each(a, function(v, key){
			if(!attr[key]){
				attr[key] = K.clone(v);
			}
		});
	});
	
	class_.ATTRS = attr;
};



var INITIALIZE 		= 'initialize',
	__DESTRUCT 		= '__destruct',
	__SUPER_CLASS 	= '__super',
	// __PRIVATE 		= '__private',
	// PRIVATE_MEMBERS = [__SUPER_CLASS, __DESTRUCT],
	EXTS			= {};


// @public
function Class(base, proto){
	var EXTENDS = 'Extends';

	if(!K.isObject(proto)){
		if(K.isObject(base)){				// -> Class({ key: 123 })
			proto = base;
			base = proto[EXTENDS];
			
		}else{								// -> Class(myClass)
			return K.isFunction(base) ? base : function(){};
		}
	}	
	
	delete proto[EXTENDS];
	
	return _Class(base, proto);
};


/**
 * @private
 * @param {function()|Class}
 * @param {Object} proto must be an object
 */
function _Class(base, proto){
	function newClass(){
		var self = this,
			init = initialize;
		
		// clean and unlink the reference relationship between the instance and its prototype
		// K.clone(self, isPublicMember, self);
		K.clone(self, false, self);
	
		if(init){
			return initialize.apply(this, arguments);
		}
	};
	
	var IMPLEMENTS = 'Implements',
		F,
		newProto,
		
		// so, KM.Class could make a new class inherit from a pure javascript constructor
		// inherit constructor from superclass
		initialize = proto[INITIALIZE] || base,
		exts = proto[IMPLEMENTS];
		
	delete proto[INITIALIZE];
	delete proto[IMPLEMENTS];
	
	// apply super prototypes
	if(base){
		F = function(){};
		
		// discard the parent constructor
		F.prototype = base.prototype;
		newClass.prototype = new F;
		
		// argument proto has the highest priority
		newProto = K.mix(newClass.prototype, proto);
	}else{
		newProto = newClass.prototype = proto;
	}
	
	// no override
	// Implements have the lowest priority
	exts && implement(newClass, exts);
		
	if(base){
		newProto[__SUPER_CLASS] = base;
	}
	
	// fix constructor
	newProto.constructor = newClass;
	
	return newClass;
};


/**
 * @public members
 * ----------------------------------------------------------------------- */


// @deprecated
// use KM.Class instead
// for backwards compact
K.__HOST.Class =

// KM.Class
K.Class = Class;

Class.EXTS = EXTS;
// Class.PRIVATE_MEMBERS = PRIVATE_MEMBERS;

/**
 * method to destroy a instance
 */
Class.destroy = function(instance){
	var destructor = instance[__DESTRUCT];
	destructor && destructor();
};

Class.implement = implement;

Class.setAttrs = setAttrs;

})(KM);


/**
 change log:
 
 2011-09-19  Kael:
 - fix a bug the instance fail to clear the reference off its prototype
 
 2011-09-16  Kael:
 - remove a reserved word for possible future use
 - complete class extends
 
 2011-09-13  Kael:
 - refractor the whole implementation about Class
 
 2011-09-12  Kael:
 TODO:
 - A. add destructor support
 - B. make Class faster if there's no Extends
 - C. no merge, use KM.clone instead
 
 */