import {settings, select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart{
  constructor(element) {
    const thisCart = this;

    thisCart.products = [];

    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;

    thisCart.getElements(element);
    thisCart.initActions();
  }

  getElements(element){
    const thisCart = this;

    thisCart.dom = {};

    thisCart.dom.wrapper = element;

    thisCart.dom.toggleTrigger = element.querySelector(select.cart.toggleTrigger);

    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    thisCart.renderTotalKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];

    thisCart.renderTotalKeys.forEach(function(key){
      thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
    });

  }

  initActions(){
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click',function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function(){
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function(){
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisCart.sendOrder();
    });

  }

  sendOrder(){
    const thisCart = this;

    const url = settings.db.url + '/' + settings.db.order;

    const payload = {
      address: thisCart.dom.address.value,
      phone: thisCart.dom.phone.value,
      totalPrice: thisCart.totalPrice,
      subtotal: thisCart.subtotalPrice,
      totalNumber: thisCart.totalNumber,
      products: [],
    };

    thisCart.products.forEach(function(product){
      const data = product.getData();
      payload.products.push(data);
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(rawResponse => rawResponse.json())
      .then(parsedResponse => {
        console.log(parsedResponse);
      });

  }

  add(menuProduct){
    const thisCart = this;


    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    const cartContainer = document.querySelector(select.cart.productList);
    cartContainer.appendChild(generatedDOM);


    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

    thisCart.update();
  }

  update(){
    const thisCart = this;

    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    thisCart.products.forEach(function(product){
      thisCart.totalNumber += product.amount;
      thisCart.subtotalPrice += product.price;
    });

    thisCart.totalPrice = thisCart.deliveryFee + thisCart.subtotalPrice;

    thisCart.renderTotalKeys.forEach(function(key){
      thisCart.dom[key].forEach(function(elem){
        elem.innerHTML = thisCart[key];
      });
    });
  }

  remove(cartProduct){
    const thisCart = this;

    const index = thisCart.products.indexOf(cartProduct);
    thisCart.products.splice(index, 1);

    cartProduct.dom.wrapper.remove();

    thisCart.update();
  }

}

export default Cart;
