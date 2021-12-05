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

      const runText = (column, row, letter) => {
        // If it's only one letter
        if (letter.length === 1) {
          inputFocus(column, row, letter)
          if (localStorage['moveAfterInput'] === 'true') moveFocus('next', column, row);
        }
      }

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
                if (!e.shiftKey)
                  selectColour('black', e.ctrlKey)
                else runText(i, j, e.key)
                break;
              case 'Digit2':
                if (!e.shiftKey)
                  selectColour('red', e.ctrlKey)
                else runText(i, j, e.key)
                break;
              case 'Digit3':
                if (!e.shiftKey)
                  selectColour('green', e.ctrlKey)
                else runText(i, j, e.key)
                break;
              case 'Digit4':
                if (!e.shiftKey)
                  selectColour('yellow', e.ctrlKey)
                else runText(i, j, e.key)
                break;
              case 'Digit5':
                if (!e.shiftKey)
                  selectColour('blue', e.ctrlKey)
                else runText(i, j, e.key)
                break;
              case 'Digit6':
                if (!e.shiftKey)
                  selectColour('purple', e.ctrlKey)
                else runText(i, j, e.key)
                break;
              case 'Digit7':
                if (!e.shiftKey)
                  selectColour('cyan', e.ctrlKey)
                else runText(i, j, e.key)
                break;
              case 'Digit8':
                if (!e.shiftKey)
                  selectColour('white', e.ctrlKey)
                else runText(i, j, e.key)
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
              case 'Space':
                inputFocus(i, j, ' ', 'fg', '')
                break;
              // Update colours.
              case 'Enter':
                inputFocus(i, j, undefined)
                break;
              // Delete all the information about the item.
              case 'Delete':
                inputFocus(i, j, e.code)
                break;
              default:
                runText(i, j, e.key)
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
  const updateTerminalOutput = (block = g('block'), output = g('output')) => {

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
    /// @type{function(Element, string): string} */
    const toShellRGB = (item, type = '') => {

      let colour = item.getAttribute(`data-${type}`)
      
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

        let codeColour = parseInt( g(colour).getAttribute('data-pallete') )

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

        itemValue += toShellRGB( item, 'fg' )
        itemValue += toShellRGB( item, 'bg' )
        itemValue += addStyles( item.getAttribute('data-bold'), item.getAttribute('data-italic'), item.getAttribute('data-underline') )

        // Text from the item.
        output.value += itemValue + item.value;

        // Add line break at the end of the row
        if (j === localStorage['blockHeight'] - 1) output.value += '\r\n'

      }

    }

    // Remove trailed spaces of the left to center the art.
    let leftSpace = output.value.replace(new RegExp('(?!^ +)\\S.*', 'gm'), '').split('\n')
    leftSpace.pop() // Remove useless extra line...
    leftSpace = Math.min(...(leftSpace.map(el => el.length)))
    output.value = output.value.replace(new RegExp(`^ {${leftSpace}}`, 'gm'), '')

    // Remove trailed spaces of the right.
    output.value = output.value.replace(new RegExp(' +$', 'gm'), '');

    // Remove first empty lines and last empty lines.
    output.value = output.value.replace(new RegExp('^\n*|\n+$', 'g'), '')

    // Add credits if there is any without trailed spaces of the right.
    const commentArt = n('commentArt')[0].value.replace(new RegExp(' +$', 'gm'), '')
    if (commentArt) output.value = '# ' + commentArt.replace(new RegExp('^ +'), '') + '\n' + output.value

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

  const inputFocus = (column = 0, row = 0, text, type = undefined, colour = localStorage['data-colour'] ) => {

    const block = g('block');
    
    // Apply the colour for the item and text.
    const applyItemColour = (columnItem = 0, rowItem = 0) => {

      const item = block.children[columnItem].children[rowItem]

      // Get item from document.
      if (text !== 'Delete') {
        applyColour(block, columnItem, rowItem, type, colour)
        applyEffect(block, columnItem, rowItem, 'bold', localStorage['isBold'])
        applyEffect(block, columnItem, rowItem, 'italic', localStorage['isItalic'])
        applyEffect(block, columnItem, rowItem, 'underline', localStorage['isUnderline'])
      } else {
        // TODO: make applyColour accept two arrays containing the types and effects
        applyColour(block, columnItem, rowItem, 'fg', '')
        applyColour(block, columnItem, rowItem, 'bg', '')
        applyEffect(block, columnItem, rowItem, 'bold', '')
        applyEffect(block, columnItem, rowItem, 'italic', '')
        applyEffect(block, columnItem, rowItem, 'underline', '')
        item.value = ' '
        localStorage[`item-${columnItem}-${rowItem}`] = ' '
        return
      }

      // Apply text.
      if (text !== undefined) {
        item.value = text
        localStorage[`item-${columnItem}-${rowItem}`] = text
      }

    }

    // Loop throughout the selected items to apply the colour.
    if (c('selected').length > 0)
      for (const itemInf of selectedItems)
        applyItemColour(itemInf[0], itemInf[1], text);
    // If just one, just apply one (the current within input).
    else
      applyItemColour(column, row);

    // Pass the new text to the output block.
    updateTerminalOutput()

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
  const selectColour = (elementName, isCtrl = false, isElement = false, definiteChoice = false) => {

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

    if (element.classList.contains('selectedColour') && !definiteChoice) cleanOthers();
    else {

      cleanOthers()

      element.classList.add('selectedColour')
      // If the element is RGB
      if (element.value)
        localStorage['data-colour'] = element.value
      else
        localStorage['data-colour'] = element.getAttribute('data-colour');

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

      const mainBlock = new Block(c('block')[0], localStorage['blockHeight'], localStorage['blockWidth'])
            mainBlock.render()
      updateTerminalOutput()

      if (!remove) g('block').children[0].children[0].focus();

    }

    // Update the styles of items, like font-size and width.
    const updateItemStyle = (items = [], remove = false) => {

      const styleSheet = document.styleSheets[0]

      if (remove) {
        // 3 for the next 3 styles that are added...
        styleSheet.deleteRule(0);
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
        #output {

          font-size: ${localStorage['fontSize']}px;

        }
      `, 0);

      styleSheet.insertRule(`
        #block::after {

          backdrop-filter: blur(${localStorage['blockBlur']}px);
          opacity: ${localStorage['blockOpacity']};

        }
      `, 0);

    }

    // Apply the first (or last used) theme to the whole page.
    const updateTheme = (theme, themeName = localStorage['lastTheme'], remove = false) => {

      // If none was saved locally before.
      if (themeName) theme = theme[themeName];
      else           theme = theme['arcoiris']; // Default theme name.

      // Update values on screen and remotelly.
      localStorage['lastTheme'] = themeName
      n('themesList')[0].value  = themeName
      
      // Remove the previous rule CSS for the previous theme.
      if (remove) document.styleSheets[1].deleteRule(0);

      // Add colours RGB parameters to pallete picker.
      Object.keys(coloursNames).forEach( item => {
        g(item).setAttribute( 'data-colour', item)
        coloursNames[item] = theme[item]
      });

      document.styleSheets[1].insertRule(`

        :root {

          --black: ${theme.black}; --black-bright: ${theme.blackBright};
          --red: ${theme.red}; --red-bright: ${theme.redBright};
          --green: ${theme.green}; --green-bright: ${theme.greenBright};
          --yellow: ${theme.yellow}; --yellow-bright: ${theme.yellowBright};
          --blue: ${theme.blue}; --blue-bright: ${theme.blueBright};
          --purple: ${theme.purple}; --purple-bright: ${theme.purpleBright};
          --cyan: ${theme.cyan}; --cyan-bright: ${theme.cyanBright};
          --white: ${theme.white}; --white-bright: ${theme.whiteBright};

          --background-path: url('../data/themes/${theme.Image.Path}');
          --font-name: ${theme.FontName};

          --background: ${theme.background}; --foreground: ${theme.foreground};

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
    const styleKeys = [ 'fontSize', 'itemWidth', 'itemHeight', 'blockOpacity', 'blockBlur' ]
    styleKeys.forEach( item => {
      n(item)[0].addEventListener( 'keydown', e => {
        if (e.key === 'Enter') updateItemStyle(styleKeys, true);
      })
    });

    // Update when the name of the art changes.
    const delay = ms => new Promise(res => setTimeout(res, ms));
    [ 'nameArt' ].forEach( item => {
      n(item)[0].addEventListener( 'keydown', async e => {
        if (e.key === 'c' && e.ctrlKey) {

          // Get numbers and input from artName
          let text = g('output').value.split('\n')
          if (text[0][0] === "#") text.shift(); // If there is the comment/credits at the first line, remove it.
          text = (
              e.explicitOriginalTarget.value.replace(new RegExp(' +$', 'gm'), '')
            + ' ' + Math.max(...(text.map(el => el.length))) // Max columns of the ASCII art
            + ' ' + text.length); // Rows of the ASCII art

          // Write to clipboard
          navigator.clipboard.writeText(text)

          // Notification
          const container = g('information')
          container.insertAdjacentHTML( 'beforeend', `
            <div class="notification">
              Added <span class="copied">${text}</span> to the clipboard
            </div>
          ` )
          const notification = c('notification')[c('notification').length - 1]
          await delay(1000)
          notification.classList.add('leave')
          await delay(1000)
          notification.remove()

        }
      })

    });

    // Update when the credits changes to the output.
    [ 'commentArt' ].forEach( item => {
      n(item)[0].addEventListener( 'keyup', () => updateTerminalOutput() )
    });

    // Add all themes for the selection.
    Object.keys(json.themes).forEach( item => {
      n('themesList')[0].insertAdjacentHTML( 'beforeend', `<option value="${item}">${item}</option>` )
    });
    n('themesList')[0].addEventListener( 'change', e =>  updateTheme(json.themes, e.explicitOriginalTarget.value, true) );


    // Add events for colours to pick.
    for (const item of c('colour')) {
      item.addEventListener( 'change', () => selectColour(item, undefined, true, true) );
      item.addEventListener( 'click', () => selectColour(item, undefined, true, true) );
      item.addEventListener( 'contextmenu', e => {
        e.preventDefault()
        selectColour(item, undefined, true)
      });
    }
    // Apply theme to the page.
    updateTheme(json.themes);

    // Update style of the items.
    updateItemStyle(styleKeys)

    // Clean the selected colour that we had.
    selectColour(undefined)

    // Our container for the blocks and columns.
    newBlock(formatKeys)

  })

})
