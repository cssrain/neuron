/**
 * module  model
 * object manager, add or remove object members. 
 */

function escapeHTML(string){
	return string.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;')
				 .replace(/</g, '&lt;')
				 .replace(/>/g, '&gt;')
				 .replace(/"/g, '&quot;')
				 .replace(/'/g, '&#x27;')
				 .replace(/\//g,'&#x2F;');
};


/**
 * @param {Object} host
 */
function swapMethods(host, move, as, backup){
    host[backup] = host[move];
    host[move] = host[as];
    
    delete host[as];
};


var

// TODO: 
// global env
MAX_HISTORY_STATE = 20,

EVENT_LOAD = 'load',
EVENT_ERROR = 'error',
EVENT_SAVE = 'save',

Model = NR.Class({
    Implements: 'events attrs',
    
    /**
	 * Override this method
	 */
	sync: function(actionType, callback){},
    
    initialize: function(options){
        var self = this;
    
        self.set({id: NR.guid()});
		self.set(options);
		
		swapMethods(self, 'set', '_set', '__set');
		
		self._history = [];
	},
	
	load: function(callback){
    	this.sync('read', function(){
        	callback(res);
    	});
	},
	
	save: function(callback){
	    this.sync('update', /* create */ function(res){
    	    callback(res);
	    });
	},
	
	undo: function(){
    	this._history.pop();
        this.__set(this._historyHead());
	},
	
	_historyHead: function(){
    	var history = this._history;
    	
    	return history[history.length - 1];
	},
	
	/**
	 * Update the value of a specified key associated with the model.
	 * It will override Class.Ext.attrs.set after initialization
	 * @return {boolean} whether the key is successfully updated
	 
	 <code>
	 1. 
	 .set('username', 'kael');
	 
	 2.
	 .set({
	 	username: 'kael',
	 	email: 'i@kael.me'
	 });
	 
	 </code>
	 
	 */
    _set: function(key, value){
        var
        
        self = this,
        obj = {},
        
        validators = self.get('validators'),
        validator = validators[key],
        pass = true;
        
        if(NR.isPlainObject(key)){
            obj = key;
        }else{
            obj[key] = value;
        }
        
        for(key in obj){
            value = obj[key];

            if(validator && !validator(value) || !self.__set(key, value) ){
                delete obj[key];
            }
        }
        
        self._pushState(obj);
    },
    
    /**
     * Add an item to the history stack
     */
    _pushState: function(item){
        var history = this._history;
        
        history.push(item);
        
        while(history.length > MAX_HISTORY_STATE){
            history.shift();
        }
    },
		
	/**
	 * remove a key
	 * example:
	 <code>
	 	.remove('name');
	 	.remove('name', 'gender');
	 </code>
	 */
	remove: function(/* item1, item2, ... */){
		var self = this;
		
		NR.makeArray(arguments).forEach(function(key){
			self.removeAttr(key);
		});
		
		return self;
	},
	
	escape: function(key){
		var value = this.get(key);
		
		return escapeHTML(value ? '' + value : '');
	}
	
}, {
	validators: {
	
		// so that we could add validator rules after initilization
		setter: function(rules){
			return NR.mix(this.get('validators'), rules);
		},

		getter: function(v){
			return v || {};
		}
	},
	
	id: {
		writeOnce: true
	}
});


module.exports = Model;

/**
 @usage:
 
 var Classmate = NR.Class({
    Extends: Model
 }, {
    name: {value: null},
    gender: {value: null},
    score: {value: null}
 });
 
 */
 
/**
 
 change log:
 
 2012-06-10  Kael:
 
 - mvp/model could undo several steps of data changes
 
 */