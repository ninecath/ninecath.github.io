import { r, g, c, s, x } from "./xeact.js";

/*
 * Mouse events initialize
 */

let button_down = 0;

/*
 * Start everything
 **/


r( () => { // IIFE to avoid globals
  
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
  // Had to make a loop because normal get plus removing was working a weird manner.
  // TODO: if SHIFT is enable, don't run this
  const removeSelected = () => {
    while (c('selected').length >= 1) {

      const selectedInputs = c('selected');
      for (const selected of selectedInputs) selected.classList.remove('selected');

    }
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

  const inputFocus = (block, column = 0, row = 0, text = '') => {

    if (c('selected').length > 0) {

      const [firstColumn, secondColumn, firstRow, secondRow] = parseSelection()
    
      for (let i = firstColumn; i <= secondColumn; i++) {

        for (let j = firstRow; j <= secondRow; j++) {

          block.children[i].children[j].value = text
          localStorage[`item-${i}-${j}`]      = text

        }

      }

    }

    // Main item
    block.children[column].children[row].value = text;
    localStorage[`item-${column}-${row}`]      = text;

    updateTerminalOutput(block)

  }

  // NOTE  : Focus a number of selected elements.
  const selectFocus = (block, firstColumn = 0, firstRow = 0, secondColumn = 0, secondRow = 0) => {

    removeSelected();

    [firstColumn, secondColumn, firstRow, secondRow] = parseSelection()

    // Add focus to new selected elements
    //console.log(`After: From ${firstColumn} to ${secondColumn}.\nAfter: From ${firstRow} to ${secondRow}.`)
    for (let i = firstColumn; i <= secondColumn; i++) {

      for (let j = firstRow; j <= secondRow; j++) {

        block.children[i].children[j].classList.add('selected')

      }

    }

  }

  // To move a item position to another
  const moveFocus = (direction = '', column = 0, row = 0) => {

    // TODO: If shift is enabled, just add this a new selected.
    removeSelected();

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

    c('column')[column].children[row].focus();

  }

   fetch('./data/config.json')
  .then(response => response.json())
  .then(json => {

    // Random title name
    window.document.title = `ascii-creator ${json['title-icons'][json['title-icons'].length * Math.random() | 0]}`

    // Our container for the blocks and columns
    const block = g('block')
    block.addEventListener('mouseleave', () => button_down = 0)

    // config.json Constants
    localStorage['infiniteMoving'] = json['infinite-moving']
    localStorage['blockHeight']    = json['default-height']
    localStorage['blockWidth']     = json['default-width']
    localStorage['moveAfterInput'] = json['move-after-input']
    
    // Add columns
    for (let i = 0; i < localStorage['blockHeight']; i++) {

      block.insertAdjacentHTML( 'beforeend', `<div data-column="${i}" class="column"></div>`)
      const column = c('column')[i]

      // Add column items
      for (let j = 0; j < localStorage['blockWidth']; j++) {

        column.insertAdjacentHTML( 'beforeend', `<input type="text" maxlength="1" data-column="${i}" data-row="${j}" class="column-item">` )
        // Add movement event
        const item = c('column')[i].children[j]
        // Set old value from localStorage
        if (localStorage[`item-${i}-${j}`]) item.value = localStorage[`item-${i}-${j}`];

        /*
         * Events for items
         */
        
        item.addEventListener('keydown', e => {

          switch (e.code) {

            case 'ArrowUp':
              moveFocus('up', i, j)
              break;
            case 'ArrowDown':
              moveFocus('down', i, j)
              break;
            case 'ArrowRight':
              moveFocus('right', i, j)
              break;
            case 'ArrowLeft':
              moveFocus('left', i, j)
              break;
            case 'Backspace':
              inputFocus(block, i, j)
              break;
            default:
              // If it's only one letter
              if (e.key.length === 1) {
                inputFocus(block, i, j, e.key)
                if (localStorage['moveAfterInput'] === 'true') moveFocus('next', i, j);
              }
          }

        });

        item.addEventListener('mouseup', () => button_down = 0)
        item.addEventListener('mousedown', e => {

          e.preventDefault()
          button_down = 1
          e.explicitOriginalTarget.focus()
          removeSelected(); // Add this element if shift is enabled
          localStorage['firstColumn'] = i
          localStorage['firstRow']    = j

        });
        item.addEventListener('mouseenter', e => {

          if (button_down)
            selectFocus( block,
              localStorage['firstColumn'],
              localStorage['firstRow'],
              localStorage['secondColumn'] = e.explicitOriginalTarget.getAttribute('data-column'),
              localStorage['secondRow'] = e.explicitOriginalTarget.getAttribute('data-row'));

        });

      }

    }

    updateTerminalOutput(block)

  }) 

})
