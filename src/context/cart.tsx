import api from '@/services/api'
import constate from 'constate'
import update from 'immutability-helper'
import { normalize, schema } from 'normalizr'
import { useEffect, useState } from 'react'

export interface CartItems {
  id: number
  nome: string
  quantidade: number
  sku: string
  url_imagem: string
  observacao: string
  valor_unitario: number
}

export interface UseCartItemsState {
  cartItems: Record<string, CartItems>
  setCartItems: Function
  increaseItemQuantity: Function
  decreaseItemQuantity: Function
  deleteItem: Function
  checkout: Function
  addItemObservation: Function
  loading: boolean
  errorMessage: string
  checkoutErrorMessage: string
  orderId: string
}

function useCartItems(): UseCartItemsState {
  const [cartItems, setCartItems] = useState<Record<string, CartItems>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState<string>('')
  const [orderId, setOrderId] = useState<string>('')

  async function increaseItemQuantity(id: number): Promise<void> {
    setCartItems(
      update(cartItems, {
        [id]: {
          quantidade: { $apply: x => x + 1 }
        }
      })
    )
  }

  async function decreaseItemQuantity(id: number): Promise<void> {
    setCartItems(
      update(cartItems, {
        [id]: {
          quantidade: { $apply: x => (x > 1 ? x - 1 : x) }
        }
      })
    )
  }

  async function deleteItem(id: number): Promise<void> {
    // If the name of the property to remove is constant
    const key = id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: value, ...withoutSecond } = cartItems
    setCartItems(withoutSecond)
  }

  async function addItemObservation(
    id: number,
    observation: string
  ): Promise<void> {
    setCartItems(
      update(cartItems, {
        [id]: {
          observacao: { $set: observation }
        }
      })
    )
  }

  async function getCartItems(): Promise<void> {
    setLoading(true)

    try {
      const response = await api({
        method: 'GET',
        url: `/carrinho`
      })
      const { data } = response
      const items = new schema.Entity('items')
      const { entities } = normalize(data, [items])
      setCartItems(entities.items)
    } catch (error) {
      setErrorMessage(
        'Não foi possível obter os itens, tente novamente mais tarde'
      )
    }
    setLoading(false)
  }

  async function checkout(userInfo): Promise<void> {
    const cartItemsList = Object.values(cartItems)
    const checkoutData = { items: cartItemsList, userInfo }
    setLoading(true)
    try {
      const response = await api({
        method: 'POST',
        url: `/carrinho`,
        data: checkoutData
      })
      // simular retorno de numero pedido
      setOrderId('10')
    } catch (error) {
      setCheckoutErrorMessage(
        'Não foi possível finalizar o pedido, tente novamente'
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    getCartItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    checkout,
    orderId,
    cartItems,
    setCartItems,
    loading,
    errorMessage,
    checkoutErrorMessage,
    increaseItemQuantity,
    decreaseItemQuantity,
    deleteItem,
    addItemObservation
  }
}

const [CartItemsProvider, useCartItemsContext] = constate(useCartItems)

export { CartItemsProvider, useCartItemsContext }
