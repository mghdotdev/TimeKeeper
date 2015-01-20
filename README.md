# TimeKeeper

### What is it?
TimeKeeper makes it easy to keep track of billable hours while working with clients. It also records your Admin time whenever a record is not active!

### How to use it:
To get started either... Create a New Record or Import from a JSON File.

Once a Record has been created, you can Open a Timestamp and begin working.

After you're finished working press the Close button. The time elapsed will be rounded to the nearest 0.25 hour and calculated towards the Record total.

### Import From JSON File Format
Substitute [x] with the described value.  
```javascript
{
  "admin_time": [miliseconds],
  "records": [
    {
      "name": [string],
      "total": [milliseconds],
      "done": [boolean],
      "timestamps": [
        {
          "from": [unix timestamp],
          "to": [unix timestamp],
          "difference": [milliseconds]
        }
      ]
    }
  ]
}
```
