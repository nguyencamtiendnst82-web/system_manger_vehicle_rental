const products = [
    { id: 1, name: "Laptop", price: 20000000, quantity: 5 },
    { id: 2, name: "Mouse", price: 500000, quantity: 20 },
    { id: 3, name: "Keyboard", price: 1200000, quantity: 10 },
    { id: 4, name: "Monitor", price: 5000000, quantity: 0 }
];

//tính tổng gtri hàng tồn
function calculateTotalInventory(products)
{
   let num = 0;
   products.forEach(product =>{
        num += product.price * product.quantity;
   })
   return num;
    
}
//console.log("tong gia tri: ", calculateTotalInventory(products))

//tìm sản phẩm hết hàng
function findOutOfStock(products)
{
    let ht = []
    products.forEach(product =>{
        if(product.quantity == 0 ) ht.push(product.name);
    })
    return ht;

}
//console.log("san pham het hang la: ", findOutOfStock(products))


//Tìm sản phẩm có giá lớn hơn price
function findExpensiveProducts(products, price)
{
    let pr = []
    let giatri = 10000000
    products.forEach(product =>{
        if(product.price > giatri) pr.push(product.name)
    })
    return pr;
}
//console.log("san pham co gia tri lon hon 10000000 la: ", findExpensiveProducts(products))

//san pham co price*quantity cao nhat
function findMostValuableProduct(products)
{
    let num
    let ln = {}
    let max = 0
    products.forEach(product =>{
        num = product.price * product.quantity;
        if (num > max)
        {
            ln = product.name;
            max = num;
        }
    })
    return ln;
}
console.log(findMostValuableProduct(products))