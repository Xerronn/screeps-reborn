import os, re, shutil, json, requests, argparse
from requests.auth import HTTPBasicAuth

parser = argparse.ArgumentParser(description="A screeps code formatter and uploader.")
parser.add_argument("-d", "--dry-run", help="Run without connecting to the screeps server.", action="store_true")
parser.add_argument("-l", "--local", help="Copy files into the screeps folder locally. Specify the branch", default=None)

args = parser.parse_args()

isDryRun = args._get_kwargs()[0][1]
local = args._get_kwargs()[1][1] + "/"

#load the credentials from the config file
with open("config/credentials.json") as f:
    credentials = json.load(f)

url = "https://screeps.com:443/api/user/code"

#define that we are sending json files
headers = {
    'Content-Type': 'application/json; charset=utf-8'
}

data = {
    "branch": "default",
    "modules": {}
}

#get a list of all js files in our src
fileList = []
for subdir, dirs, files in os.walk("./src"):
    for file in files:
        filepath = subdir + os.sep + file

        if filepath.endswith(".js"):
            fileList.append(filepath.replace("src_", ""))

#remove old files and remake the directory
if os.path.isdir("./dist"):
    shutil.rmtree("./dist")
os.mkdir("./dist")

#copy all the files we found in the src folder to the dist folder
for file in fileList:
    new = file.replace(os.sep, "_").replace("src_", "")
    shutil.copy(file, f"./dist/{new}")

#now we iterate through the files and modify import statements to match the flat names
for subdir, dirs, files in os.walk("./dist"):
    for file in files:
        filepath = subdir + os.sep + file
        with open(filepath) as infile:
            contents = infile.read()
            #find all require statements
            requires = ", ".join(re.findall('require\(.+\)', contents))
            #get the contents inside the parenthesis
            paths = re.findall('\(([^)]+)\)', requires)
            #todo: find a more elegant solution
            for path in paths:
                new = path

                #replace the current folder with the full path
                if "./" in new[0:3]:
                    directory = file.split("_")
                    #if its root, delete the ./
                    if len(directory) > 1:
                        fullPath = ""
                        for i in range(len(directory) - 1):
                            fullPath += directory[i] + "/"
                        new = new.replace("./", fullPath)
                    else:
                        new = new.replace("./", "")
                
                #replace the parent folder with the full path
                if "../" in new[0:4]:
                    directory = file.split("_")
                    #if its root, just delete the ../
                    if len(directory) > 2:
                        fullPath = ""
                        for i in range(len(directory) - 2):
                            fullPath += directory[i] + "/"
                        new = new.replace("../", fullPath)
                    else:
                        new = new.replace("../", "")
                new = new.replace("/", "_")

                contents = contents.replace(path, new)
        
        #replace the contents of the file with the edited requires
        with open(filepath, 'w') as outfile:
            outfile.write(contents)
        
        data["modules"][filepath.split('\\')[-1][:-3]] = contents

#if a path is passed, copy the resulting files to that path if it is valid
if local is not None:
    #for windows
    if os.name == "nt":
        fullPath = f"C:/Users/{os.getlogin()}/AppData/Local/Screeps/scripts/screeps.com/{local}"
        #remove all contents of the folder
        if os.path.isdir(fullPath):
            shutil.rmtree(fullPath)
        os.mkdir(fullPath)
        
        #copy all the files to the new folder
        for subdir, dirs, files in os.walk("./dist"):
            for file in files:
                filepath = subdir + os.sep + file
                shutil.copy(filepath, fullPath + file)
        print(f"Files copied into {fullPath}")
    else:
        #todo windows, linux support
        pass

#upload the files to the screeps folder is dry run isnt specified
if not isDryRun:      
    try:
        r = requests.post(
            url = url, 
            data = json.dumps(data, separators=(',', ':')), 
            headers = headers, 
            auth = HTTPBasicAuth(credentials['username'], credentials['password'])
        )

        print(r.content)
    except:
        print("Connection to screeps servers failed")
else:
    print("Ran successfully without upload")