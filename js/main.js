document.addEventListener("DOMContentLoaded", () => { // IIFE to avoid globals
  
  // To update the terminal output 
  updateTerminalOutput = block => {

    const output = document.getElementById('output')
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
  
  // To move a item position to another
  const moveFocus = (direction, column, row) => {

    const isInfinite = localStorage['infiniteMoving'],
          blockHeight = localStorage['blockHeight'] - 1,
          blockWidth = localStorage['blockWidth'] - 1

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

    }
    
      document.getElementsByClassName('column')[column].children[row].focus();

  }
  
   fetch('./data/config.json')
  .then(response => response.json())
  .then(json => {

    // Random title name
    window.document.title = `ascii-creator ${json['title-icons'][json['title-icons'].length * Math.random() | 0]}`

    // Our container for the blocks and columns
    const block = document.getElementById('block')

    // config.json Constants
    localStorage['infiniteMoving'] = json['infinite-moving']
    localStorage['blockHeight']    = json['default-height']
    localStorage['blockWidth']     = json['default-width']
    
    // Add columns
    for (let i = 0; i < localStorage['blockHeight']; i++) {

      block.insertAdjacentHTML( 'beforeend', `<div data-column="${i}" class="column"></div>`)
      const column = document.getElementsByClassName('column')[i]

      // Add column items
      for (let j = 0; j < localStorage['blockWidth']; j++) {

        column.insertAdjacentHTML( 'beforeend', `<input type="text" maxlength="1" data-column-item="${j}" class="column-item">` )
        // Add movement event
        const item = document.getElementsByClassName('column')[i].children[j]
        // Set old value from localStorage
        if (localStorage[`item-${i}-${j}`]) item.value = localStorage[`item-${i}-${j}`];
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
              item.value = ''
              updateTerminalOutput(block)
              localStorage[`item-${i}-${j}`] = ''
              break;
            default:
              if (e.key.length === 1) {
                item.value = e.key
                updateTerminalOutput(block)
                localStorage[`item-${i}-${j}`] = e.key
              }
          }

        });

      }

    }

    updateTerminalOutput(block)

  }) 

})
