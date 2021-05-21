import os, re, shutil, json, requests
from requests.auth import HTTPBasicAuth

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
            for path in paths:
                new = path
                if "./" in new[0:3]:
                    directory = file.split("_")
                    #make sure its not root
                    if len(directory) > 1:
                        new = new.replace("./", directory[0] + "/")
                    else:
                        new = new.replace("./", "")
                if "../" in new[0:4]:
                    directory = file.split("_")
                    
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
            

r = requests.post(
    url = url, 
    data = json.dumps(data, separators=(',', ':')), 
    headers = headers, 
    auth = HTTPBasicAuth(credentials['username'], credentials['password'])
)

print(r.content)
