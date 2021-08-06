import os, re, shutil, json, requests, argparse
from requests.auth import HTTPBasicAuth

parser = argparse.ArgumentParser(description="A screeps code formatter and uploader.")
parser.add_argument("-d", "--dry-run", help="Run without connecting to the screeps server.", action="store_true")
parser.add_argument("-l", "--local", help="Copy files into the screeps folder locally. Specify the branch", default=None)

args = parser.parse_args()

isDryRun = args._get_kwargs()[0][1]
local = args._get_kwargs()[1][1]
if local is not None:
    local = local + os.sep

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

#remove old files and remake the directory
if os.path.isdir("./dist"):
    shutil.rmtree("./dist")
os.mkdir("./dist")

#loop through all the files in our src
for subdir, dirs, files in os.walk("src"):
    for file in files:
        filepath = subdir + os.sep + file
        #only deal with the javascript files. You can use readmes and stuff this way
        if filepath.endswith(".js"):
            #find the path where we want to store our new file
            newpath = filepath.replace(os.sep, "_").replace("src_", "")

            #get the contents of the file and store it
            with open(filepath) as infile:
                contents = infile.read()
            
            #find all require statements
            requires = ", ".join(re.findall('require\(.+\)', contents))
            #get the contents inside the parenthesis
            paths = re.findall('\(([^)]+)\)', requires)

            #loop through all instances of require paths
            for path in paths:
                #split by each part of the path
                splitpath = path.replace("\"", "").replace('\'', "").split('/')
                splitreq = filepath.replace("src\\", "").split(os.sep)
                #the rules below only work on the first occurrence, 
                # so these variables modify the logic after the first occurrence
                firstUp = False
                firstStay = False

                for split in splitpath:
                    #if . move up one split
                    if split == ".":
                        if not firstStay:
                            splitreq.pop()
                            firstStay = True
                    #if .. move up two splits
                    elif split == "..":
                        if not firstUp:
                            splitreq.pop()
                            splitreq.pop()
                            firstUp = True
                        else:
                            splitreq.pop()
                    else:
                        splitreq.append(split)

                #replace the old paths with the new ones
                newreq = "\"" + "_".join(splitreq) + "\""
                contents = contents.replace(path, newreq)

            #replace the contents of the file with the edited requires
            with open("dist" + os.sep + newpath, 'w') as outfile:
                outfile.write(contents)
            
            #store the contents of the file in the data object we push to screeps
            data["modules"][newpath[:-3]] = contents

#if a branch is passed, copy the resulting files to that branch
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
        #todo mac, linux support
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