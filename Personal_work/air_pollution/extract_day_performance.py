# -*- coding: utf-8 -*-
"""
Created on Mon Aug 19 20:52:36 2024

@author: Steve
"""

import os
# Get the current script directory
current_path = os.path.dirname(os.path.abspath(__file__))

# Change the working directory to the script's directory
os.chdir(current_path)

#%%
import pandas as pd

train_forecast=pd.read_excel(r"D:\lab\research\pm25_3days_output\result(from github)\performance(mcnn-bp).xlsx",sheet_name="forecast")
test_forecast=pd.read_excel(r"D:\lab\research\pm25_3days_output\result(from github)\testing_performance(mcnn-bp).xlsx",sheet_name="forecast")
train_forecast=train_forecast.iloc[:, [2, 3]].join(train_forecast.iloc[:, 5:])
train_forecast.columns= test_forecast.columns[1:]
forecast = pd.concat([train_forecast,test_forecast.iloc[:, 1:]],axis=0)

#%%
# Ensure the datetime column is correctly parsed
forecast ['datetime'] = pd.to_datetime(forecast['datetime'], format='%Y%m%d_%H%M')
# Rename the forecast columns
new_column_names = {forecast.columns[i]: f't+{i-1}' for i in range(2, 74)}
forecast.rename(columns=new_column_names, inplace=True)
# Assuming 'site id' is the name of the column you want to sort by
forecast = forecast.sort_values(by='SITE ID')
# If you want to reset the index after sorting, you can do:
forecast = forecast.reset_index(drop=True)

#%%
# Create a directory to save the files
output_dir = 'pred'
os.makedirs(output_dir, exist_ok=True)


# Group the data by date (removing time)
forecast['date'] = forecast['datetime'].dt.date
grouped = forecast.groupby('date')

# Iterate over each group (each day) and save to CSV
for date, group in grouped:
    # Remove the 'date' and 'datetime' columns if not needed in the CSV
    group = group.drop(columns=['date'])
    
    # Define the filename with the format 'YYYYMMDD.csv'
    filename = f"{date.strftime('%Y%m%d')}.csv"
    
    # Save to CSV
    group.to_csv(os.path.join(output_dir, filename), index=False)
    
    
#%%
train_obs=pd.read_excel(r"D:\lab\research\pm25_3days_output\result(from github)\performance(mcnn-bp).xlsx",sheet_name="realoutput")
test_obs=pd.read_excel(r"D:\lab\research\pm25_3days_output\result(from github)\testing_performance(mcnn-bp).xlsx",sheet_name="realoutput")
test_obs=pd.concat([test_forecast.iloc[:,1:3],test_obs.iloc[:,1:]],axis=1)
train_obs=train_obs.iloc[:, [2, 3]].join(train_obs.iloc[:, 4:])
train_obs.columns= test_obs.columns
obs = pd.concat([train_obs,test_obs],axis=0)

#%%
# Ensure the datetime column is correctly parsed
obs['datetime'] = pd.to_datetime(obs['datetime'], format='%Y%m%d_%H%M')
# Rename the forecast columns
new_column_names = {obs.columns[i]: f't+{i-1}' for i in range(2, 74)}
obs.rename(columns=new_column_names, inplace=True)
# Assuming 'site id' is the name of the column you want to sort by
obs = obs.sort_values(by='SITE ID')
# If you want to reset the index after sorting, you can do:
obs = obs.reset_index(drop=True)

#%%
# Create a directory to save the files
output_dir = 'obs'
os.makedirs(output_dir, exist_ok=True)

# Group the data by date (removing time)
obs['date'] = obs['datetime'].dt.date
grouped = obs.groupby('date')

# Iterate over each group (each day) and save to CSV
for date, group in grouped:
    # Remove the 'date' and 'datetime' columns if not needed in the CSV
    group = group.drop(columns=['date'])
    
    # Define the filename with the format 'YYYYMMDD.csv'
    filename = f"{date.strftime('%Y%m%d')}.csv"
    
    # Save to CSV
    group.to_csv(os.path.join(output_dir, filename), index=False)
    