import requests
import csv
from bs4 import BeautifulSoup
import time
import wget
import ssl
import random

ssl._create_default_https_context = ssl._create_unverified_context
domain = "https://digital.lib.umd.edu"
attributes = {'Title'}
downloaded_map_cnt = 0

def download_image(record):
    time.sleep(random.random() * 1)
    link = domain + record.find('a')['href']
    try:
        return wget.download(link)
    except:
        return link

def get_map(link, fields, dowwnload_the_image):
    link = domain + link
    print(link)
    map_page = requests.get(link)
    map_soup = BeautifulSoup(map_page.content, 'html.parser')
    divs = map_soup.find_all("div", {"class": "search-record"})
    title_div = map_soup.find("div",  {"id": "main-content"})
    title_text = title_div.find("h1").text.strip()
    map_record = {'Title': title_text}
    for d in divs:
        record = d.find_all("div")
        key = record[0].text.strip()[:-1]
        if key == "Digital Image":
            val = download_image(record[1])
        else:
            val = record[1].text.strip()
        map_record[key] = val
        fields.add(key)
    print(map_record)
    return map_record

def parse_maps():
    url_base = "https://digital.lib.umd.edu/mdmap/search/facet/Digitized/Yes?pageNumber="
    maps = []
    map_cnt = 0
    for i in range(1,7):
        page = requests.get(url_base+str(i))
        soup = BeautifulSoup(page.content, 'html.parser')
        divs = soup.find_all("div", {"class": "search-record"})
        for d in divs:
            time.sleep(random.random()*2+5)
            maps.append(get_map(d.find('a')['href'], attributes, map_cnt>=downloaded_map_cnt))
            map_cnt += 1
    return maps

mapslist = parse_maps()
with open('maps.csv', 'w', newline='') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=attributes)
    writer.writeheader()
    writer.writerows(mapslist)