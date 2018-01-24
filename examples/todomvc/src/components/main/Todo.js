import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { withRoot } from '../../providers/RootProvider'


const ENTER_KEY = 13
const ESC_KEY = 27


export default withRoot(WithTodo)


function WithTodo({
  id,
  rootStore: { editTodo, removeTodo, selectTodoById, toggleComplete }
}) {
  return (
    <Todo
      {...selectTodoById(id)}
      editTodo={editTodo}
      removeTodo={removeTodo}
      toggleComplete={toggleComplete}
    />
  )
}


class Todo extends Component {
  static propTypes = {
    editTodo: PropTypes.func.isRequired,
    id: PropTypes.number.isRequired,
    isComplete: PropTypes.bool.isRequired,
    text: PropTypes.string.isRequired,
    toggleComplete: PropTypes.func.isRequired
  }


  constructor(props) {
    super(props)

    this.state = {
      isEditing: false,
      text: props.text
    }
  }


  cancelEdit = () => {
    this.setState((state, props) => ({
      text: props.text, // reset the text
      isEditing: false
    }))
  }


  checkEditKey = event => {
    if (event.which === ENTER_KEY) return this.saveEdit(event)
    if (event.which === ESC_KEY) return this.cancelEdit()
  }


  edit = () => {
    this.setState({
      isEditing: true
    })
  }


  removeTodo = () => {
    this.props.removeTodo(this.props.id)
  }


  saveEdit = ({ currentTarget: { value } }) => {

    // Persist the edit to the store
    this.props.editTodo({
      id: this.props.id,
      text: value
    })

    // Also save stuff locally
    this.setState({
      text: value,
      isEditing: false
    })
  }


  setText = ({ currentTarget: { value } }) => {
    this.setState({
      text: value
    })
  }


  toggleComplete = event => {
    this.props.toggleComplete(this.props.id)
  }


  render() {
    const { isEditing, text } = this.state
    const { id, isComplete } = this.props

    const liClasses = []

    if (isEditing) liClasses.push('editing')
    if (isComplete) liClasses.push('completed')

    return (
      <li className={liClasses.join` `}>
        <div className="view">
          <input
            className="toggle"
            type="checkbox"
            checked={isComplete}
            onChange={this.toggleComplete}
          />
          <label onDoubleClick={this.edit}>{text}</label>
          <button className="destroy" onClick={this.removeTodo}></button>
        </div>
        <input
          className="edit"
          name={id}
          value={text}
          onChange={this.setText}
          onKeyUp={this.checkEditKey}
          onBlur={this.saveEdit}
        />
      </li>
    )
  }
}
