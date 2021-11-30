import { r, g, c, n } from "./xeact.js";

/*
 * Mouse events initialize
 */

let button_down = 0;

/* 
 * Initialize localStorage
 * */

var selectedItems = []
var coloursNames = {
  'black': '', 'blackBright': '', 'red': '', 'redBright': '', 'green': '', 'greenBright': '',
  'yellow': '', 'yellowBright': '', 'blue': '', 'blueBright': '', 'purple': '', 'purpleBright': '',
  'cyan': '', 'cyanBright': '', 'white': '', 'whiteBright': ''
}


/*
 * Start everything
 **/


r( async () => { // IIFE to avoid globals



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
      return g('block')

    }

    item (type = '', column = 0, row = 0) {

      switch (type) {

        case 'row':
          return `<input type="text" maxlength="1" data-column="${column}" data-row="${row}" value=" " class="column-item">`
        case 'column':
          return `<div data-column="${column}" class="column"></div>`
        case 'block':
          return `<!-- Our big block -->\n<div id="block"></div>`

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
          if (localStorage[`item-fg-${i}-${j}`]) applyColour(block, i, j, 'fg', localStorage[`item-fg-${i}-${j}`]);
          if (localStorage[`item-bg-${i}-${j}`]) applyColour(block, i, j, 'bg', localStorage[`item-bg-${i}-${j}`])
          if (localStorage[`item-bold-${i}-${j}`]) applyEffect(block, i, j, 'bold', localStorage[`item-bold-${i}-${j}`]);
          if (localStorage[`item-underline-${i}-${j}`]) applyEffect(block, i, j, 'underline', localStorage[`item-underline-${i}-${j}`])
          if (localStorage[`item-italic-${i}-${j}`]) applyEffect(block, i, j, 'italic', localStorage[`item-italic-${i}-${j}`])

          // Events for items
          item.addEventListener('keydown', e => {

            switch (e.code) {
              // Apply pallete colours.
              case 'Digit1':
                selectColour('black', e.ctrlKey)
                break;
              case 'Digit2':
                 selectColour('red', e.ctrlKey)
                break;
              case 'Digit3':
                selectColour('green', e.ctrlKey)
                break;
              case 'Digit4':
                selectColour('yellow', e.ctrlKey)
                break;
              case 'Digit5':
                selectColour('blue', e.ctrlKey)
                break;
              case 'Digit6':
                selectColour('purple', e.ctrlKey)
                break;
              case 'Digit7':
                selectColour('cyan', e.ctrlKey)
                break;
              case 'Digit8':
                selectColour('white', e.ctrlKey)
                break;
              // Main keys.
              case 'ArrowUp':
                moveFocus('up', i, j, e.shiftKey)
                break;
              case 'ArrowDown':
                moveFocus('down', i, j, e.shiftKey)
                break;
              case 'ArrowRight':
                moveFocus('right', i, j, e.shiftKey)
                break;
              case 'ArrowLeft':
                moveFocus('left', i, j, e.shiftKey)
                break;
              case 'Backspace':
                inputFocus(i, j, ' ')
                break;
              // Update colours.
              case 'Enter':
                inputFocus(i, j, undefined)
                break;
              // Delete all the information about the item.
              case 'Delete':
                const item = block.children[i].children[j]
                item.style.color = ''
                item.style.backgroundColor = ''
                item.value = ' '
                item.removeAttribute('data-fg')
                item.removeAttribute('data-bg')
                item.removeAttribute('data-bold')
                item.removeAttribute('data-italic')
                item.removeAttribute('data-underline')
                localStorage[`item-${i}-${j}`] = ' '
                localStorage[`item-fg-${i}-${j}`] = ''
                localStorage[`item-bg-${i}-${j}`] = ''
                localStorage[`item-bold-${i}-${j}`] = ''
                localStorage[`item-italic-${i}-${j}`] = ''
                localStorage[`item-underline-${i}-${j}`] = ''
                updateTerminalOutput(block)
                break;
              default:
                // If it's only one letter
                if (e.key.length === 1) {
                  inputFocus(i, j, e.key)
                  if (localStorage['moveAfterInput'] === 'true') moveFocus('next', i, j);
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

          // TODO: Middle click to toggle colour.

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

  /* To update the terminal output
  // @type{function(HTMLElement, HTMLElement): undefined} */
  const updateTerminalOutput = (block, output = g('output')) => {

    // Reset the output to nothing.
    output.value = ''

    // Transform the style effects to SHELL code..
    /// @type{function(string boolean, string boolean, string boolean): string} */
    const addStyles = (italic = '', bold = '', underline = '' ) => {

      let valueStyles = ''
     
      // For bold.
      if (bold === 'true') {
        if (localStorage['output-last-bold'] !== 'true') valueStyles += '\\033[1m';
        localStorage['output-last-bold'] = 'true'
      } else {
        if (localStorage['output-last-bold'] !== '') valueStyles += '\\033[22m';
        localStorage['output-last-bold'] = ''
      }

      // For italic.
      if (italic === 'true') {
        if (localStorage['output-last-italic'] !== 'true') valueStyles += '\\033[3m';
        localStorage['output-last-italic'] = 'true'
      } else {
        if (localStorage['output-last-italic'] !== '') valueStyles += '\\033[23m';
        localStorage['output-last-italic'] = ''
      }


      // For underline.
      if (underline === 'true') {
        if (localStorage['output-last-underline'] !== 'true') valueStyles += '\\033[4m';
        localStorage['output-last-underline'] = 'true'
      } else {
        if (localStorage['output-last-underline'] !== '') valueStyles += '\\033[24m';
        localStorage['output-last-underline'] = ''
      }

      return valueStyles;

    }
    
    // Transform colour to SHELL code..
    /// @type{function(string, string): string} */
    const toShellRGB = (colour = '', type = '') => {

      // Set a comparable string so we can verify later if there isn't any at all.
      if (colour === null) colour = `clear-${type}`;
 
      // || Verify if this colour is the same as the last one used so that it doesn't repeat 2 > times.
      if (colour === localStorage[`output-last-${type}-colour`]) return '';
 
      // Save to verify later if it is the same colour being used.
      localStorage[`output-last-${type}-colour`] = colour

      // The type of colour for the shell to apply to.
      // 38 : foreground.
      // 48 : background.
      let codeRGBType = 38
      if (type === 'bg') codeRGBType += 10;

      // If there isn't anything to update...
      if (colour === `clear-${type}`) return `\\033[${codeRGBType + 1}m`
 
      // If the colour is HEX
      if (colour[0] === '#') {

        // Transform the colour to RGB from HEX.
        colour = (() => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
          return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
          ] : null;
        })();

        // Return the complete value of that character + RGB colours.
        return `\\033[${codeRGBType};2;${colour[0]};${colour[1]};${colour[2]}m`
      }

      // If it is one of the 4-bit (8-16 default SHELL colours).
      else {

        let codeColour = '';

        switch (colour) {

          case 'black': codeColour = 30; break;  case 'blackBright': codeColour = 90; break;
          case 'red': codeColour = 31; break;    case 'redBright': codeColour = 91; break;
          case 'green': codeColour = 32; break;  case 'greenBright': codeColour = 92; break;
          case 'yellow': codeColour = 33; break; case 'yellowBright': codeColour = 93; break;
          case 'blue': codeColour = 34; break;   case 'blueBright': codeColour = 94; break;
          case 'purple': codeColour = 35; break; case 'purpleBright': codeColour = 95; break;
          case 'cyan': codeColour = 36; break;   case 'cyanBright': codeColour = 96; break;
          case 'white': codeColour = 37; break;  case 'whiteBright': codeColour = 97; break;

        }

        if (type === 'bg') codeColour += 10;

        return `\\033[${codeColour}m`
      }

    }

    // Loop throughout all children.
    for (let i = 0; i < localStorage['blockWidth']; i++) {

      for (let j = 0; j < localStorage['blockHeight']; j++) {

        const item = block.children[j].children[i]

        // Initialize text variable.
        let itemValue = ''

        itemValue += toShellRGB( item.getAttribute('data-fg'), 'fg' )
        itemValue += toShellRGB( item.getAttribute('data-bg'), 'bg' )
        itemValue += addStyles( item.getAttribute('data-bold'), item.getAttribute('data-italic'), item.getAttribute('data-underline') )

        // Text from the item.
        output.value += itemValue + item.value;

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
  
  // Apply effect (bold, italic, underline) to an element.
  const applyEffect = (block, column, row, type = '', isEffect) => {

    const item = block.children[column].children[row]

    // Apply such effect.
    if (isEffect === 'true') {

      item.setAttribute( `data-${type}`, isEffect );
      localStorage[`item-${type}-${column}-${row}`] = true

    // Do not apply the effect/remove it.
    } else {

      item.removeAttribute( `data-${type}` )
      localStorage[`item-${type}-${column}-${row}`] = ''

    }

  }
  
  // Apply BG/FG colour to the item.
  const applyColour = (block, column = 0, row = 0, type = '', colour = '') => {

    const item = block.children[column].children[row]

    // So that repeating is not excessive...
    const addColourStyle = (element, typeItem = '') => {

      if (colour) {

        // Reset the colours set by # to normal one.
        if (typeItem === 'bg') item.style.backgroundColor = '';
        else item.style.color = '';

        // If the colour is hash and not built-in from theme.
        if (colour[0] === '#') {
          if (typeItem === 'bg') item.style.backgroundColor = colour;
          else item.style.color = colour;
        }

        element.setAttribute(`data-${typeItem}`, colour);

      // Remove colour if there wasn't any selected.
      } else {
        if (typeItem === 'bg') item.style.backgroundColor = '';
        else item.style.color = '';
        element.removeAttribute(`data-${typeItem}`);
      }

      localStorage[`item-${typeItem}-${column}-${row}`] = colour

    }

    if (!type) {

      if (localStorage['isBackground'] === 'true') addColourStyle(item, 'bg');
      else addColourStyle(item, 'fg');

    } else addColourStyle(item, type);

  }

  const inputFocus = (column = 0, row = 0, text, colour = localStorage['data-colour']) => {

    const block = g('block');
    
    // Apply the colour for the item and text.
    const applyItemColour = (columnItem = 0, rowItem = 0) => {

      const item = block.children[columnItem].children[rowItem]

      // Get item from document.
      applyColour(block, columnItem, rowItem, undefined, colour)
      applyEffect(block, columnItem, rowItem, 'bold', localStorage['isBold'])
      applyEffect(block, columnItem, rowItem, 'italic', localStorage['isItalic'])
      applyEffect(block, columnItem, rowItem, 'underline', localStorage['isUnderline'])

      // Apply text.
      if (text !== undefined) {
        item.value = text
        localStorage[`item-${columnItem}-${rowItem}`] = text
      }

    }
    
    if (c('selected').length > 0)
      for (const itemInf of selectedItems)
        applyItemColour(itemInf[0], itemInf[1]);
    else
      applyItemColour(column, row);

    // Pass the new text to the output block.
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
  const moveFocus = (direction = '', column = 0, row = 0, isShifted = false) => {

    const block   = g('block')
    let oldColumn = column,
        oldRow    = row;

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

  // Apply a colour of a pallete.
  const selectColour = (elementName, isCtrl = false, isElement = false) => {

    let element;

    const cleanOthers = () => {
      for (const selected of c('selectedColour')) selected.classList.remove('selectedColour');
      localStorage['data-colour'] = ''
    }

    if (elementName === undefined) return cleanOthers();

    if (!isElement) {
      // Pick bright colour from pallete if CTRL is enabled.
      if (isCtrl) elementName += 'Bright';
      element = g(elementName)
    } else element = elementName;

    if (element.classList.contains('selectedColour')) cleanOthers();
    else {

      cleanOthers()

      element.classList.add('selectedColour')
      localStorage['data-colour'] = element.getAttribute('data-colour')

    }

    // If there are current selected elements, then apply the new colour to it.
    if (c('selected').length > 0) inputFocus(0, 0, undefined);

  }

  // Load config.json.
  fetch('./data/config.json')
  .then(response => response.json())
  .then(json => {

    // New block to input new art.
    const newBlock = (items = [], remove = false) => {
      if (remove) g('block').remove();

      items.forEach( item => localStorage[item] = n(item)[0].value)

      const mainBlock = new Block(document.body, localStorage['blockHeight'], localStorage['blockWidth'])
            mainBlock.render()
      updateTerminalOutput(g('block'))

    }

    // Update the styles of items, like font-size and width.
    const updateItemStyle = (items = [], remove = false) => {

      const styleSheet = document.styleSheets[0]

      if (remove) {
        styleSheet.deleteRule(0);
        styleSheet.deleteRule(0);
      }

      items.forEach( item => localStorage[item] = n(item)[0].value)

      styleSheet.insertRule(`
        #block .column-item {

          font-size: ${localStorage['fontSize']}px;
          width: ${localStorage['itemWidth']}rem; height: ${localStorage['itemHeight']}rem;

        }
      `, 0);

      styleSheet.insertRule(`
        #block {

          backdrop-filter: opacity(${localStorage['blockOpacity']}%) blur(${localStorage['blockBlur']}px);

        }
      `, 0);

    }

    // Apply the first (or last used) theme to the whole page.
    const updateTheme = theme => {

      // Add colours RGB parameters to pallete picker.
      Object.keys(coloursNames).forEach( item => {
        g(item).setAttribute( 'data-colour', item)
        coloursNames[item] = theme[item]
      });

//      c('colour').forEach( item => {

        //item.setAttribute('data-colour', localStorage['rgb-0-colour'])

//      });

      document.styleSheets[0].insertRule(`

        :root {

          --black: ${theme.black}; --black-bright: ${theme.blackBright};
          --red: ${theme.red}; --red-bright: ${theme.redBright};
          --green: ${theme.green}; --green-bright: ${theme.greenBright};
          --yellow: ${theme.yellow}; --yellow-bright: ${theme.yellowBright};
          --blue: ${theme.blue}; --blue-bright: ${theme.blueBright};
          --purple: ${theme.purple}; --purple-bright: ${theme.purpleBright};
          --cyan: ${theme.cyan}; --cyan-bright: ${theme.cyanBright};
          --white: ${theme.white}; --white-bright: ${theme.whiteBright};

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
    [ 'infiniteMoving', 'moveAfterInput', 'isBackground', 'isBold', 'isUnderline', 'isItalic' ].forEach( item => {
      n(item)[0].addEventListener( 'change', e => {
        localStorage[item] = e.target.checked
      })
    });

    // Update when ENTER is pressed.
    const formatKeys = [ 'blockHeight', 'blockWidth' ]
    formatKeys.forEach( item => {
      n(item)[0].addEventListener( 'keydown', e => {
        if (e.key === 'Enter') newBlock(formatKeys, true)
      })
    });

    // Update when ENTER is pressed.
    const styleKeys = [ 'fontSize', 'itemWidth', 'itemHeight', 'blockOpacity' ]
    styleKeys.forEach( item => {
      n(item)[0].addEventListener( 'keydown', e => {
        if (e.key === 'Enter') updateItemStyle(styleKeys, true);
      })
    });

    // Add events for colours to pick.
    for (const item of c('colour'))
      item.addEventListener( 'click', () => selectColour(item, undefined, true));

    // Apply theme to the page.
    updateTheme(json.themes['arcoiris'])

    // Update style of the items.
    updateItemStyle(styleKeys)

    // Clean the selected colour that we had.
    selectColour(undefined)

    // Our container for the blocks and columns.
    newBlock(formatKeys)

  })

})
