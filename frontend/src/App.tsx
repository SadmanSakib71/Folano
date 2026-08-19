import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import MainLayout from './components/layout/MainLayout'
import Cart from './pages/Cart'
import Home from './pages/Home'
import Orders from './pages/Orders'
import Preorders from './pages/Preorders'
import ProductDetail from './pages/ProductDetail'
import Products from './pages/Products'

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/preorders" element={<Preorders />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/cart" element={<Cart />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
