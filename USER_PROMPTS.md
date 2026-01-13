# CSV Contact Parser Prompts

Below are the prompts that I used to create the CSV Contact Parser application.

## User Prompts

### Prompt 1

I want to create a node application called contact-csv-parser.  please create me the project folder and initalize the application for node and git.

### Prompt 2

I need to parse a csv file that has a bunch of contact records with multiple contacts that has a tags column that is comma delimited and I need to create a file for each tag that has all of the records for contacts that have that tag.  I want to write the output to a directory called output and within that directory create a directory named after the csv file without csv extension. Each time the output is written, if there are any files in the csv output directory, create a backup directory based on the date and time and move all of the files into that.

### Prompt 3

in this directory, I need to parse a csv file that has a bunch of contact records with multiple contacts that has a tags column that is comma delimited and I need to create a file for each tag that has all of the records for contacts that have that tag.  I want to write the output to a directory called output and within that directory create a directory named after the csv file without csv extension. Each time the output is written, if there are any files in the csv output directory, create a backup directory based on the date and time and move all of the files into that.

### Prompt 4

create me a sample csv file and make sure that it has several columns of data in it like first name, last name, email, date added, tags, list name and a few other random ones.  For the tags column, make sure some records only have a single tag, others have 2 tags and others have 3 or more tags.

### Prompt 5

for the created output lines, I do not need the folder.  I just need the output/ and further

### Prompt 6

lets add a clear command for a given csv that will remove the output directory for that csv file.  lets add a yes/no prompt and default it to no.

### Prompt 7

instead of writing our own prompt library, is there one that we can use where it will allow us to pass in the csv file to clear the output for and if no file is passed in then it will show us a list of csv files to select from and then prompt a yes/no prompt with the default being no. these prompts need to be interactive.  I typically use @inquirer/prompts but am open to suggestions

### Prompt 8

when running the app currently you have to tell it what you want to do.  lets modify that and add a select menu for the available functions if no parameters are passed in.  As well for the parse command, if no file is passed then display the list of csv file to choose from.

### Prompt 9

lets add a headers only command that will output the name of the columns to the console and order them A-Z.

### Prompt 10

for the parse command, prompt me to select the tag column if one is not passed in as a parameter.  default to Tags.  also, make the column finding for the tags case insensitive and error if it find two Tags columns with different casing.

### Prompt 11

create me a sample csv file that has multiple Tag columns with different casing so I can test the error of more than 1 existing.

### Prompt 12

when the user exists the prompt it currently displays a very ugly errors.  can we capture that and just display a user existed message instead?

### Prompt 13

lets create a compare files (e.g. diff) command that will take in a csv file that is the base file and then the updated file and it will only output the csv files for the records that are different.  lets create this as a diff folder within the csv output folder and do the same backups within the diff folder like we do for the csv file.  also, create me a sample csv file for the diff.

### Prompt 14

when the parse and diff commands are run, I would like a log file output that says which files were created and with how many records in each file.  sort the list of files A to Z.  lets call the file summary.log

### Prompt 15

for the clear command, lets add the option to only remove the backup folders

### Prompt 16

I would like you to parse the prompts.md and copy all of the user prompts and commands that were not done by copilot and write them to the file user-prompts2.md.  only write files within the project directory

### Prompt 17

please create me an automated test suite.  please recommend the testing framework to use and why you picked that framework. make sure that the tests write only to the project directory even for tmp files and make sure it clears up temp files when it is done with them.  for the test suite, we want to write any output to a output-test directory instead of the output directory so that we do not accidentally override any user based files.  Do not remove the output directory as that is user content, only the clear command should be able to remove files in the output directory. for the test suite, please put the tests into a file for each of the commands instead of having all of them in a single file.  This will make it easier to find the test for a specific function and to test a specific function without running the whole suite.  Also, move any utility type methods into helper files.

## Prompt 18: Project Specification Document

create me a spec file for this project and call the spec file project-spec-csv-parser-011226.md

## Prompt 19: Extract User Prompts (First Request) after running `/share file session.md`

I would like you to parse the session.md and copy all of the user prompts and commands that were not done by copilot and write them to the file prompts.md.  only write files within the project directory
