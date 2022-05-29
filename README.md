# Custom Dictionary(自製字典庫)

## How to use

1. open any web
2. press `three` times the keyboard `CTRL`
3. then the dictionary search page will pop

## Keyboard shortcut

1. `CTRL ↓`:will select next row
2. `CTRL ↑`:will select previous row
3. `CTRL →`:will select next category
4. `CTRL ←`:will select previous category
5. `CTRL Mouse Primary Button`:will show now selected row value to search bar
6. `Primary Button`:will paste now selected row value to your browser focus element

![Demo keyboard shortcut.gif](https://raw.githubusercontent.com/papago89/Custom-Dicionary/main/Demo%20keyboard%20shortcut.gif))](https://raw.githubusercontent.com/papago89/Custom-Dicionary/main/Demo%20keyboard%20shortcut.gif)

## Search use static string

1. just key in the string to search bar

![Demo search static string](https://raw.githubusercontent.com/papago89/Custom-Dicionary/main/Demo%20search%20static%20string.gif)

## Search use regexp

1. use the `/` surround your regexp: `/[0-9]{3}/`

![Demo search regexp](https://raw.githubusercontent.com/papago89/Custom-Dicionary/main/Demo%20search%20regexp.gif)

## setting page

1. can look the test data:

```json
{
    "ControlKeyPage1": {
        "name": "Control key Page 1",
        "data": [
            {
                "value": "CTRL + ↓",
                "description": "will select next row"
            },
            {
                "value": "CTRL + ↑",
                "description": "will select previous row"
            },
            {
                "value": "CTRL + →",
                "description": "will select next category"
            },
            {
                "value": "CTRL + your mouse primary button(通常是左鍵)",
                "description": "will show now selected row value to search bar"
            },
            {
                "value": "enter",
                "description": "will paste now selected row value to your browser focus element"
            }
        ]
    },
    "ControlKeyPage2": {
        "name": "Control key Page 2",
        "data": [
            {
                "value": "CTRL + ←",
                "description": "will select previous category"
            }
        ]
    },
    "record-2": {
        "name": "test-2",
        "data": [
            {
                "value": "this is test-1 value",
                "description": "simple description"
            },
            {
                "value": "this is test-2 value, don't set the description"
            }
        ]
    },
    "record-3": {
        "name": "test-3",
        "data": [
            {
                "value": "127.0.0.1",
                "description": "just test regexp find IP"
            }
        ]
    },
    "record-4": {
        "name": "test-4",
        "data": [
            {
                "value": "blablabla\n            \n            blablabla",
                "description": "data can put newline."
            }
        ]
    },
    "record-5": {
        "name": "this data from website json file",
        "url": "https://cdn.jsdelivr.net/gh/papago89/temp/fav-json"
    }
}
```

![Demo setting page](https://raw.githubusercontent.com/papago89/Custom-Dicionary/main/Demo%20setting%20page.gif)
