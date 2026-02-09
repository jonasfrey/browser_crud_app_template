# abstract 
AI tools have become very powerful. This app makes use of them to percieve image, video (many images) and audio data and convert them to text. this text is very preciuous because it provides a different form of data that later can be used to filter and and manipulate the original image and audio data. 

# technical 

## GUI
a denojs webserver will provide a simple http server to initially serve a web GUI. on the client side the javascript then connects to a websocket to make sure a blazing fast communcation can be established from the client to server and backwards. 
## backend server programming language  
denojs (native ESM6 javascript, not Typescript!, whereer possible)
denojs -> calls binaries 
 - python (used for locally running Artifical Intelligence models )
 - ffmpeg: helpful tools for extracting image data from videos for example

## frontend 
- native html , javascript and css. 


## persistant data (database)
DB: SQLite (file-based, no server)
ORM: DenoDB

## working directory structure

### webserved_dir
the html , css, and javascript that is sent and run on the client
#### ./functions.module.js
the generic javascript functions that are used on the client side and maybe on the server side, for example instantiating an object f_o_dimensions(...) can be done on the client side and also on the server side. 
#### ./constructors.module.js

### ./functions.module.js
the generic functions that can only be used on the server side. for example reading files from the file system can be done with Deno.readFile() but cannot be done on the client side javascript


### ./webserver_denojs.js
the main entry point for the webserver

### ./function_testing.module.js
a file used for executing and testing functions 

### 

# milestones
the application is developed step by step 
the goals/milestones are documentet here

## read directory recursively
create a front end page that takes a input string and has a button 'f_a_o_file' . once clicked the inputted path gets checked, and file information in this folder is gathered recursively.
then the folders are shown as a list . the folders can be clicked to be expanded and to show their content. the sub folders are indented (depending on the nesting level )and can also can be clicked. 

### one page for all
there should be a home page with all 'subpages' . technically all runs on that single page but there is a navigation on top when a navigation item is clicked all other pages are hidden and the page with the title that has been clicked on  should be shown. 
currently we have two pages: 
- analyze files
    - a page where a directory can be scanned 
- configuration
    - a page where the configuration of this application instance can be updated
        - configuration

### data persistency
the object f_o_config should be written (crud 'create' and 'update')to the database. and if the configuration page is  visited the config should be read (crud 'read')

### database 
all the f_o_[namehere] functions in the constructos.module.js represent 'models' that should be available in the database


### gui for database
a page 'data' that is like a minimal version of 'phpmyadmin' that lets browse the database and allows data manipulation (CRUD) of the database


### crud db function
there is a generic function that can be used to manipulate db data 'f_v_crud__indb' , implement this 

### code cleanup, 
the function f_o_model__from_s_name_table can be loaded from 'constructors.module.js'. so that it has not to be coded redundantly. find other functions that may are coded redundant. 

### frontend change to Vue.js v3 with options API
the project front end currently is programmed in native html css javascript. 
use Vue.js 3 for the frontend

### refactor o_file to o_fsnode
in linux a file and  a folder are basically both a node with the only difference that a folder 
can have children . that is why we renamed the model 'o_file' to 'o_fsnode'


### request reponse with websocket
implement a simple basic generic request response mechanism with websocket. i can imagine a request having a UUID as a identifier to respond to a certain request. 

### analyze files
data persistance:
- when the path has been changed and 'f_a_o_file' has been clicked. the path should be written to the config. when the page is reloaded that path should be read from config

- when a folder is being analized. 

### find out how the order of loading data works. 
### show image or video info in the front end 
the o_fsnode (files or folders) are loaded recursively . in the frontend currently only the names of folders or files are shown. if a file is a image or video show additional information such as size and duration 

### batch processing images with vitpose 
in the folder imageanalysis there is a vitpose batch processing python script. now i want to be able to process images from deno js by passing paths to the python script. the python script will return json output that then has to be stored in the database. the main function for this task is f_a_o_pose_from_a_o_img. it takes multiple o_img 
the python script has to download large AI models. those have to go into the .gitignored folder


### GUI page with image preview
i want to have another gui page which is a kind of image preview mode. it shows an image and overlays the lines of the keypoints. all the images can be cycled trhough using 'l' for next image and 'k' for previous image. on the image there is also a overlay with the text info of the pose 


### pose viewer canvas add text 
add the name of the posekeypoin to the canvas on the pose viewer

### pose viewer callback filter 
there is a db table 'a_o_pose_filter' these are objects that should be loaded on the pose viewer. they can be activated or deactiated. if activated all the images are filtered depending on the return value of the 's_f_b_show' which is the string of the callback function that can be used with js new Function()...
foreach pose filter add a monaco editor with the function string insde. also add a togler to activate and deactivate the filter. also add a expander to close and open the monaco editor. 
add the possibility of creating a new filter and deleting a filter 


### handling large amount of large sized files
at the moment the loading of fs nodes works. also does the pose estimation work. but if the amount of files is very large and if the files themself are heavy the loading takes some time. this is no where indicated in the client application. however there is a websocket that can inform the client in real time of what is going on. make use of this.  

### bug fix
somehow the pose estimation with python does not work anymore or the result is not saved in the DB 

### pose viewer rename
#### refactoring
the 'o_pose_filter' was renamed to 'o_image_filter' 
then 'o_image_filter' was renamed to 'o_image_postprocessor'
the 'o_config.a_s_filter_extension' prop was removed 

#### aditional features
rename the 'pose viewer' to 'image viewer' since there will be more data related to images that will be gathered with python script , like for example yolo image classification and salesforce/blip image to text. 
in the image viewer there should be the possibility to toggle 'pose lines' , 'pose keypoint labels' , 'image areas'(will come later with yolo), and more that is coming. 

in the image viewer in the section  'Filters' only postprocessors with b_filter == true, shoulb be shown, 
for all other postprocessors there should be a new section  'postprocessors'. 
next to each such postprocessor there should be a button to manually execute the postprocessor on all filtered images


### user guidance
the user could go to the image viewer page and load images with poses even if there is no data. if there is no data a message should be shown that first files have to be 'analyzed'
on the image viewer there should be the number of analyzed files
's_root_dir' should be available on client side and should be passed to the callback functions on the client side   


### image viewer 
in the image viewer the property 'a_o_image__data' can be renamed to simply 'a_o_image'
then if the a_o_image array is like thousands of images, it takes to much time to filter them all, so there should be a selector where a user can select ranges , like 0-100, 101-200, 201-300... 
 