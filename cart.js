Cart = {
  items: [], 
  callbacks: {}, 
  sqlWhere: [], 
  cols: { key: 'id', qtde: 'qtd', valor: 'preco', optsKey: 'id' }, 
  config: { storage: '@sacola', format: { decimals: 2 , dec_point: '.' , thousands_sep: ',', pfx: 'R$ ', sfx: '' } }
};

Cart.on = function(eventName, callback) {
    if (!Cart.callbacks[eventName]) Cart.callbacks[eventName] = [];
    Cart.callbacks[eventName].push(callback);
    return Cart;
};

Cart.trigger = function(eventName, args) {
    if (Cart.callbacks[eventName]) {
        for (var i = 0; i<Cart.callbacks[eventName].length; i++) {
            Cart.callbacks[eventName][i](args||{});
        }
    }
    return Cart;
};

Cart.randID =function(id) {
    return id+'-xyyx-yxyx-xyxy'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

Cart.save = function() {  
    localStorage.setItem(Cart.config.session, JSON.stringify(Cart.items));
    Cart.trigger('save');
    return Cart;
};

Cart.where = function(key, condition, value){
  Cart.sqlWhere.push({k: key, v: value, op: condition});
  return Cart;
};

Cart.countItems = function() {
    var accumulator = 0;
    var lista = Cart.get();
    for (var i = 0; i<lista.length; i++) {
        accumulator += lista[i][Cart.cols.qtde];
    }
    return accumulator;
};

Cart.subTotal = function() {
    var accumulator = 0;
    var lista = Cart.get();
    for (var i = 0; i<lista.length; i++) {
        accumulator += Cart.priceItem(lista[i]);
    }
    return accumulator;
};

Cart.priceItem = function(item) {
    return item[Cart.cols.valor] * item[Cart.cols.qtde];
};

Cart.formatPrice = function(price){
  var format = function (r,e,i,t){if(null==r||!isFinite(r))throw new TypeError("number is not valid");if(!e){var n=r.toString().split(".").length;e=n>1?n:0}i||(i="."),t||(t=",");var l=(r=(r=parseFloat(r).toFixed(e)).replace(".",i)).split(i);return l[0]=l[0].replace(/\B(?=(\d{3})+(?!\d))/g,t),r=l.join(i)}
  return format(price, Cart.config.format.decimals, Cart.config.format.thousands_sep, Cart.config.format.dec_point);
};

Cart.displayPrice = function(price) {
    return Cart.config.format.pfx + Cart.formatPrice(price) + Cart.config.format.sfx;
};

Cart.setItems = function(lista){
  Cart.items = lista;
  return Cart;
};

Cart.getItems = function(){
  var items = localStorage.getItem(Cart.config.storage);
    
    var lista = Cart.items;
    if(items){
      lista = JSON.parse(items);
    }  
    
    return lista;
}

Cart.mergeObj = function() {
   // Variables
   var target = {};
   var deep = true;
   var i = 0;
   
   var mergeArray = function(a, b, prop){
    var reduced = a.filter(function(aitem){
        return ! b.find(function(bitem){
            return parseInt(aitem[prop]) === parseInt(bitem[prop]);
        });
    });
    return reduced.concat(b);
  }

   // Merge the object into the target object
   var merger = function(obj){
      for (let prop in obj) {
         if (obj.hasOwnProperty(prop)) {

          if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
              target[prop] = Cart.mergeObj(target[prop], obj[prop]);

          }else if (i>0 && Object.prototype.toString.call(obj[prop]) === '[object Array]') {
              target[prop] = mergeArray(target[prop], obj[prop], Cart.cols.optsKey);

          } else {
            target[prop] = obj[prop];
          }
       }
     }
   };
    for (; i < arguments.length; i++) {
       merger(arguments[i]);
    }
    return target;
};


// CRUD
Cart.get = function(){
    var items = Cart.getItems();

    Cart.sqlWhere.forEach(function(condicao){
      items = items.filter(function(register){
          try {
             return eval(register[condicao.k] +" "+ condicao.op +" "+ condicao.v);
          }
          catch (e) {
             console.log("Erro ao usar o operador: '"+condicao.op+"'. ");
             return true;
          }
      });
    });

    return items;
};

Cart.store = function(register){
    register[Cart.cols.key] = parseInt(register[Cart.cols.key]);

    if(!register.opts){
      register.opts = [];
    }

    Cart.items.push(register);

    Cart.save();
    Cart.trigger('store', {item: register});
    return Cart;
};

Cart.find = function(id){
  var item = Cart.getItems().filter(function(element){
        return parseInt(element[Cart.cols.key]) === parseInt(id);
  });
  if(typeof item === "undefined") return null;
  return item;
}

Cart.destroy = function(id){
    var ret = false;
    var item = Cart.find(id);

    if(item){

      var lista = Cart.getItems().filter(function(element){
          return parseInt(element[Cart.cols.key]) !== parseInt(id);
      });

      Cart.setItems(lista).save();
      ret = true;
    }

    Cart.trigger('destroy', {item: item, destroy: ret});
    return ret;   
};

Cart.update = function(id, data){
    var ret = false;
    var item = Cart.find(id);

    if(item){

      var lista = Cart.getItems().map(function(element){
          if(parseInt(element[Cart.cols.key]) === parseInt(id)){
            element = Cart.mergeObj(element, data);
          }
          return element;
      });
      Cart.setItems(lista).save();
      ret = true;
    }

    Cart.trigger('update', {item: item, update: ret});
    return ret;
}

Cart.store({id: 2, nome: 'Produto A', preco: 2, qtd: 2}); 
Cart.store({id: 3, nome: 'Produto B', preco: 4, qtd: 1}); 
Cart.store({id: 4, nome: 'Produto C', preco: 6, qtd: 1}); 
Cart.store({id: 5, nome: 'Produto D', preco: 8, qtd: 3});

//Cart.where('preco', '==', 3);

//Cart.update(2, {nome: 'Produto ALT', opts: [{id: 4, nome: 'Item B'}, {id: 3, nome: 'Item C'}] });
//Cart.update(3, {opts: [{id: 4, nome: 'Item B'}] });

console.log(Cart.get());
