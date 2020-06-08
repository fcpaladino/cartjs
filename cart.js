Cart = {
  items: [], 
  callbacks: {}, 
  sqlWhere: [], 
  cols: { key: 'id', qtde: 'qtd', valor: 'preco' }, 
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

Cart.filterWhere = function (register){
    var isValid = true;
    Cart.sqlWhere.forEach(function(item){
      isValid = eval(register[item.k] +" "+ item.op +" "+ item.v);
    });

    return isValid;
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

// CRUD
Cart.get = function(){
    return Cart.getItems().filter(Cart.filterWhere);
};

Cart.store = function(register){
    register[Cart.cols.key] = parseInt(register[Cart.cols.key]);

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

      var lista = Cart.getItems().filter(function(element){
          return parseInt(element[Cart.cols.key]) !== parseInt(id);
      });

      Cart.setItems(lista).save();
      ret = true;
    }

    Cart.trigger('update', {item: item, destroy: ret});
    return ret;
}

Cart.store({id: 2, nome: 'Produto A', preco: 10, qtd: 2}); 
Cart.store({id: 3, nome: 'Produto B', preco: 10, qtd: 1}); 
//Cart.store({id: 4, nome: 'Produto C', preco: 10, qtd: 1}); 
//Cart.store({id: 5, nome: 'Produto C', preco: 10, qtd: 3});

//Cart.where('preco', '>', 10);


Cart.destroy(4);

console.log(Cart.get());
