import { r, g, c, n } from "./xeact.js";

/*
 * Mouse events initialize
 */

let button_down = 0;

/* 
 * Initialize localStorage
 * */

var selectedItems = []

/*
 * Start everything
 **/


r( () => { // IIFE to avoid globals



  /*
   * NOTE: This serve to create new blocks where you can edit arts.
   */
  class Block {

    constructor (container, columns = 1, rows = 1) {

      this._columns   = parseInt(columns)
      this._rows      = parseInt(rows)
      this._container = this.create(container)

    }

    create (container) {

      container.insertAdjacentHTML( 'beforeend', this.item('block') )
      return c('block')[0]

    }

    item (type = '', column = 0, row = 0) {

      switch (type) {

        case 'row':
          return `<input type="text" maxlength="1" data-column="${column}" data-row="${row}" class="column-item">`
        case 'column':
          return `<div data-column="${column}" class="column"></div>`
        case 'block':
          return `<div class="block"></div>`

      }

    }

    render (block = this._container) {

      for (let i = 0; i < this._columns; i++) {

        // Add column and select.
        block.insertAdjacentHTML( 'beforeend', this.item('column', i) )
        const column = c('column')[i]

        for (let j = 0; j < this._rows; j++) {

          // Add item in column and select.
          column.insertAdjacentHTML( 'beforeend', this.item('row', i, j) )
          const item = c('column')[i].children[j]

          // Set old value from localStorage for this item.
          if (localStorage[`item-${i}-${j}`]) item.value = localStorage[`item-${i}-${j}`];

          /* Events for items */
          item.addEventListener('keydown', e => {

            switch (e.code) {

              case 'ArrowUp':
                moveFocus(block, 'up', i, j, e.shiftKey)
                break;
              case 'ArrowDown':
                moveFocus(block, 'down', i, j, e.shiftKey)
                break;
              case 'ArrowRight':
                moveFocus(block, 'right', i, j, e.shiftKey)
                break;
              case 'ArrowLeft':
                moveFocus(block, 'left', i, j, e.shiftKey)
                break;
              case 'Backspace':
                inputFocus(block, i, j)
                break;
              default:
                // If it's only one letter
                if (e.key.length === 1) {
                  inputFocus(block, i, j, e.key)
                  if (localStorage['moveAfterInput'] === 'true') moveFocus(block, 'next', i, j);
                }
            }

          });

          item.addEventListener('mouseup', () => button_down = 0)
          item.addEventListener('mousedown', e => {

            e.preventDefault()
            button_down = 1
            e.explicitOriginalTarget.focus()
            if (!e.shiftKey) removeSelected(block);
            localStorage['firstColumn'] = i
            localStorage['firstRow']    = j

          });
          
          item.addEventListener('mouseenter', e => {

            if (button_down)
              selectFocus( block,
                localStorage['firstColumn'],
                localStorage['firstRow'],
                localStorage['secondColumn'] = e.explicitOriginalTarget.getAttribute('data-column'),
                localStorage['secondRow'] = e.explicitOriginalTarget.getAttribute('data-row'),
                e.shiftKey);

          });

        }

      }

    }

  }



  /*
   * Functions and main methods.
   */

  // To update the terminal output
  const updateTerminalOutput = block => {

    const output = g('output')
    output.value = ''

    for (let i = 0; i < localStorage['blockWidth']; i++) {

      for (let j = 0; j < localStorage['blockHeight']; j++) {

        const item = block.children[j].children[i]

        // Add its value
        if (item.value) output.value += item.value;
        else output.value += ' ';

        // Add line break at the end of the row
        if (j === localStorage['blockHeight'] - 1) output.value += '\r\n'

      }

    }

  }


  // Remove previous elements that were selected
  const removeSelected = block => {

    for (const item of selectedItems) {

      block.children[item[0]].children[item[1]].classList.remove('selected')

    }

    selectedItems = []

  }

  const parseSelection = () => {

    // Just to make sure it's a valid integer. JS is weird.
    let [firstColumn, secondColumn, firstRow, secondRow] = 
    [parseInt(localStorage['firstColumn']), parseInt(localStorage['secondColumn']), parseInt(localStorage['firstRow']), parseInt(localStorage['secondRow'])]
    
    // If just one element, reset the selection to none.
    if (firstColumn === secondColumn && firstRow === secondRow) return;

    // Switch to normal range {0,?} instead of {?, ?}
    if (firstColumn >= secondColumn) {

      const greaterColumn = firstColumn;
      firstColumn = secondColumn;
      secondColumn = greaterColumn;

    }
    if (firstRow >= secondRow) {

      const greaterRow = firstRow;
      firstRow = secondRow;
      secondRow = greaterRow;

    }

    return [firstColumn, secondColumn, firstRow, secondRow]
    
  }

  // xeact alike

  // Set the new character to the list of inputs.
  const inputFocus = (block, column = 0, row = 0, text = '') => {

    if (c('selected').length > 0) {

      for (const item of selectedItems) {

        block.children[item[0]].children[item[1]].value = text
        localStorage[`item-${item[0]}-${item[1]}`]      = text

      }

    }

    // Main item
    block.children[column].children[row].value = text;
    localStorage[`item-${column}-${row}`]      = text;

    updateTerminalOutput(block)

  }

  // Focus a number of selected elements.
  const selectFocus = (block, firstColumn = 0, firstRow = 0, secondColumn = 0, secondRow = 0, isShifted = false) => {

    if (!isShifted) removeSelected(block);

    [firstColumn, secondColumn, firstRow, secondRow] = parseSelection()

    // Add focus to new selected elements
    //console.log(`After: From ${firstColumn} to ${secondColumn}.\nAfter: From ${firstRow} to ${secondRow}.`)
    for (let i = firstColumn; i <= secondColumn; i++) {

      for (let j = firstRow; j <= secondRow; j++) {

        block.children[i].children[j].classList.add('selected')
        selectedItems.push([i, j])

      }

    }

  }

  // To move a item position to another
  const moveFocus = (block, direction = '', column = 0, row = 0, isShifted = false) => {

    let oldColumn = column;
    let oldRow    = row;

    const isInfinite  = localStorage['infiniteMoving'],
          blockHeight = localStorage['blockHeight'] - 1,
          blockWidth  = localStorage['blockWidth'] - 1

    switch (direction) {

      case 'up':
        if (row-- === 0 && isInfinite === 'true') row = blockHeight;
        else if (row === -1) row = 0;
        break;

      case 'down':
        if (row++ === blockHeight && isInfinite === 'true') row = 0;
        else if (row === blockHeight + 1) row = blockHeight;
        break;

      case 'right':
        if (column++ === blockWidth && isInfinite === 'true') column = 0;
        else if (column === blockWidth + 1) column = blockWidth;
        break;

      case 'left':
        if (column-- === 0 && isInfinite === 'true') column = blockWidth;
        else if (column === -1) column = 0;
        break;

      case 'next':
        if (column++ === blockWidth && isInfinite === 'true') {
          column = 0;
          row++;
        }
        else if (column === blockWidth + 1)  column = blockWidth;
        if      (row    === blockHeight + 1) row    = 0;

    }

    if (isShifted) {
      block.children[oldColumn].children[oldRow].classList.add('selected');
      selectedItems.push([oldColumn, oldRow])
      block.children[column].children[row].classList.add('selected');
      selectedItems.push([column, row])
    }
    else removeSelected(block);

    block.children[column].children[row].focus();

  }

  // Load config.json.
  fetch('./data/config.json')
  .then(response => response.json())
  .then(json => {

    // New block to input new art.
    const newBlock = () => {

      const mainBlock = new Block(document.body, localStorage['blockHeight'], localStorage['blockWidth'])
            mainBlock.render()
      updateTerminalOutput(c('block')[0])

    }

    // Update the styles of items, like font-size and width.
    const updateItemStyle = (remove = false) => {
      if (remove) document.styleSheets[0].deleteRule(0);
      document.styleSheets[0].insertRule(`
        .block .column-item {

          font-size: ${localStorage['fontSize']}px;
          width: ${localStorage['itemWidth']}rem; height: ${localStorage['itemHeight']}rem;

        }
      `, 0);

    }

    // Random title name
    window.document.title = `ascii-creator ${json['titleIcons'][json['titleIcons'].length * Math.random() | 0]}`;

    // config.json
    const storageKeys = Object.keys(json)
    for (const item of storageKeys) {

      if (item === 'titleIcons') break;

      if (!localStorage[item]) localStorage[item] = json[item]
      n(item)[0].value = localStorage[item]
      if (localStorage[item] === 'true')
        n(item)[0].checked = true;

    }

    // Update automatically when check/uncheck.
    [ 'infiniteMoving', 'moveAfterInput' ].forEach( item => {
      n(item)[0].addEventListener( 'change', e => {
        localStorage[item] = e.target.checked
      })
    });

    // Update when ENTER is pressed.
    [ 'blockHeight', 'blockWidth' ].forEach( item => {
      n(item)[0].addEventListener( 'keydown', e => {

        if (e.key !== 'Enter') return;
        localStorage['blockHeight'] = n('blockHeight')[0].value
        localStorage['blockWidth']  = n('blockWidth')[0].value
        c('block')[0].remove()
        newBlock()

      })
    });

    // Update when ENTER is pressed.
    [ 'fontSize', 'itemWidth', 'itemHeight' ].forEach( item => {
      n(item)[0].addEventListener( 'keydown', e => {
        if (e.key !== 'Enter') return;
        localStorage['fontSize']  = n('fontSize')[0].value
        localStorage['itemWidth']  = n('itemWidth')[0].value
        localStorage['itemHeight']  = n('itemHeight')[0].value
        updateItemStyle(true);
      })
    });

    // Update style of the items.
    updateItemStyle()

    // Our container for the blocks and columns.
    const mainBlock = new Block(document.body, localStorage['blockHeight'], localStorage['blockWidth'])
          mainBlock.render()

    updateTerminalOutput(c('block')[0])

  })

})
