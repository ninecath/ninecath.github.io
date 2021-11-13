document.addEventListener("DOMContentLoaded", () => { // IIFE to avoid globals

  const moveFocus = direction => {

    console.log(direction)
    
  }
  
   fetch('./data/config.json')
  .then(response => response.json())
  .then(json => {

    // Random title name
    window.document.title = `ascii-creator ${json['title-icons'][json['title-icons'].length * Math.random() | 0]}`

    // Our container for the blocks and columns
    const block = document.getElementById('block')
    
    // Add columns
    for (let i = 0; i < json['default-height']; i++) {

      block.insertAdjacentHTML( 'beforeend', `<div data-column="${i}" class="column"></div>`)
      const column = document.getElementsByClassName('column')[i]

      // Add column items
      for (let j = 0; j < json['default-width']; j++) {

        column.insertAdjacentHTML( 'beforeend', `<input type="text" maxlength="1" data-column-item="${j}" class="column-item">` )
        // Add movement event
        const item = document.getElementsByClassName('column')[i].children[j]
        item.addEventListener('keydown', e => {

          switch (e.code) {

            case 'ArrowUp':
              moveFocus('up')
              break;
            case 'ArrowDown':
              moveFocus('down')
              break;
            case 'ArrowRight':
              moveFocus('right')
              break;
            case 'ArrowLeft':
              moveFocus('left')
              break;
            case 'Backspace':
              item.value = ' '
              break;
            default:
              if (e.key.length === 1) item.value = e.key;
          }

        });

      }

    }

  }) 

})
