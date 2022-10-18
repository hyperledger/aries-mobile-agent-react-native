import { render, fireEvent } from '@testing-library/react-native'
import React from 'react'

import FauxNavigationBar from '../../src/components/views/FauxNavigationBar'
import { testIdWithKey } from '../../src/utils/testable'

describe('Faux Navigation Bar Component', () => {
  it('Renders without home icon', () => {
    const tree = render(<FauxNavigationBar title={'Hello'} />)

    expect(tree).toMatchSnapshot()
  })

  it('Renders with home icon', () => {
    const cb = jest.fn()
    const tree = render(<FauxNavigationBar title={'Hello'} onHomeTouched={cb} />)

    expect(tree).toMatchSnapshot()
  })

  it('Home button triggers callback as expected', () => {
    const cb = jest.fn()
    const tree = render(<FauxNavigationBar title={'Hello'} onHomeTouched={cb} />)
    const homeButton = tree.getByTestId(testIdWithKey('HomeButton'))

    fireEvent(homeButton, 'press')

    expect(homeButton).not.toBeNull()
    expect(cb).toBeCalledTimes(1)
  })
})
