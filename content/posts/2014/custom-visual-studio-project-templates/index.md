---
title: "Custom Visual Studio Project Templates"
description: "A guide to creating custom Visual Studio project templates in .zip and VSIX form and submitting them to the Visual Studio Gallery, so it can be downloaded."
author: "Muhammad Rehan Saeed"
permalink: "/custom-visual-studio-project-templates/"
cover_image: "./images/Visual-Studio.png"
date: "2014-12-10"
published: true
categories:
  - "Visual Studio"
tags:
  - ".NET"
  - "ASP.NET MVC"
  - "ASP.NET Core Boilerplate"
  - "C#"
  - "Project Template"
  - "VSIX"
---

Creating a custom Visual Studio project template that you can use from the 'New Project' dialogue is a great way to reduce the amount of repetitive code you have to write. It gets you running through the jungle with the leaves brushing against your face, instead of sitting at the starting block wondering where your shoes are.

The [Visual Studio Gallery](https://visualstudiogallery.msdn.microsoft.com) is a great place to share your custom Visual Studio project template with the community. There are actually two ways to create a template. I recently had to create one for [ASP.NET Core Boilerplate](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) and found it less than simple. This post talks you through creating one and submitting it to the Visual Studio Gallery, allowing anyone to use it from the 'New Project' dialogue.

![The project template shown in the 'Web' section of Visual Studio's 'New Project' dialogue.](./images/VisualStudioGallery2.png)
The project template shown in the 'Web' section of Visual Studio's 'New Project' dialogue.

# Export Template as .zip

The first method of creating a custom project template is to use the 'Export Template' wizard in Visual Studio, as shown in the steps below, you can create a .zip file which contains a template of your selected project.

![Export .zip Project Template](./images/ExportTemplate1.png)
The Visual Studio Export Template menu item for exporting a .zip project template.

The wizard allows you to select the project from your solution you want to export as a template.

![The export template 'Choose template type' screen.](./images/ExportTemplate2.png)
The export template 'Choose template type' screen.

You can even specify an icon and preview image of the project template. This is perfect as this information also gets displayed in the Visual Studio 'New Project' dialogue.

![The export template 'Select template options' screen, where you can describe your template.](./images/ExportTemplate3.png)
The export template 'Select template options' screen, where you can describe your template.

The .zip file that is output must be copied into the following folder, for Visual Studio to pick it up:

> C:/Users/[Your User Name]/Documents/Visual Studio [2010|2012|2013|2015]/Templates/ProjectTemplates

![The .zip file output as part of the Visual Studio Export Template wizard.](./images/ExportTemplate4.png)
The .zip file output as part of the Visual Studio Export Template wizard.

This is a super easy process and you should really consider creating your own templates if you find yourself making the same old changes to every project you are creating. The downside is that its not very customizable and these types of project templates cannot be submitted to the [Visual Studio Gallery](https://visualstudiogallery.msdn.microsoft.com).

The gallery website only supports project templates created using the VSIX package. Creating a VSIX package is a pretty involved process and will take a couple of hours.

# Export Template Wizard Extension

[This](https://visualstudiogallery.msdn.microsoft.com/57320b20-34a2-42e4-b97e-e615c71aca24) Visual Studio extension claims to support exporting your projects into VSIX packages using a simple wizard interface. Unfortunately, this tool is only available for Visual Studio 2010 and the Microsoft developers of the extension seem to have stopped further development.

This is a real shame. Here we have an excellent tool which the community really needs. A tool that makes creating a VSIX project template package, a matter of a few clicks. This should be built into Visual Studio out of the box!

# SideWaffle Project Templates

There is even an alternative method of creating project templates and sharing them with the community that I should mention. It's called [SideWaffle](http://sidewaffle.com) (I like the name for some reason). It makes it slightly easier to create a template but its still not as simple as a few clicks. It's certainly something worth taking a look at though.

# Creating a VSIX Package

The first step is to create a .zip project template package using the steps above. Once you've done that, download and install the [Microsoft Visual Studio 2013 SDK](https://www.microsoft.com/en-us/download/details.aspx?id=40758). This will give you new project templates to create VSIX packages. The first thing to do is create a new C# Project Template (Or a Visual Basic one if you prefer).

![The new project dialogue, showing how to create a new VSIX C# project.](./images/ExportVSIX1.png)
The new project dialogue, showing how to create a new VSIX C# project.

The next step is to open the .zip version of your project template and copy the contents into your new project. Copy everything (Including the project file), except the 'Properties' folder as this will conflict with the existing one in the project.

![An example of a VSIX C# project from the ASP.NET Core Boilerplate project template.](./images/ExportVSIX2.png)
An example of a VSIX C# project from the ASP.NET Core Boilerplate project template.

Select all the files in the project and in the properties window, ensure that their 'Build Action' is set to 'Content'.

![The properties window for a file in a VSIX C# project. Note, that the file build action has been set to 'Content'.](./images/ExportVSIX3.png)
The properties window for a file in a VSIX C# project. Note, that the file build action has been set to 'Content'.

The .vstemplate file in the project contains all the information about the contents of the project template. If you select it and go to the 'Properties' window, you can set the 'Category' property which determines where your project template will appear in the 'New Project' dialogue.

![The category a VSIX C# project is displayed under, in the Visual Studio New Project dialogue.](./images/ExportVSIX4.png)
The category a VSIX C# project is displayed under, in the Visual Studio New Project dialogue.

An example of the `.vstemplate` file is shown below. Note, that I've set the project template name, description and the default name of the project which is shown in the 'New Project' dialogue and the user can rename. The XML then goes on to declare the name of the .csproj file in the `Project` node, followed by each and every file and folder to be included in the template.

Note, that the `AssemblyInfo.cs` file is a little special. There are two of them in the project. The one we are interested in was already located in the root of the project when we created it. We also need to add it to the XML below slightly differently than the other files (See below).

You can use the `OpenInWebBrowser` or `OpenInEditor` attributes on a `ProjectItem` to get the file to be opened in a web browser or text editor when the project is first created. I've used `OpenInWebBrowser` to open the `ReadMe.html` file containing basic information about the project, when the project is first created.

```xml
<?xml version="1.0" encoding="utf-8"?>
<VSTemplate Version="3.0.0" Type="Project" xmlns="http://schemas.microsoft.com/developer/vstemplate/2005" xmlns:sdk="http://schemas.microsoft.com/developer/vstemplate-sdkextension/2010">
  <TemplateData>
    <Name>ASP.NET Core Boilerplate</Name>
    <Description>A professional ASP.NET MVC template for building secure, fast, robust and adaptable web applications or sites. It provides the minimum amount of code required on top of the default MVC template provided by Microsoft. Find out more at RehanSaeed.com</Description>
    <Icon>MvcBoilerplateTemplate.ico</Icon>
    <ProjectType>CSharp</ProjectType>
    <RequiredFrameworkVersion>4.5</RequiredFrameworkVersion>
    <SortOrder>1000</SortOrder>
    <TemplateID>f2d50b53-cff3-41b4-8481-dac14c18ea48</TemplateID>
    <CreateNewFolder>true</CreateNewFolder>
    <DefaultName>WebProject</DefaultName>
    <ProvideDefaultName>true</ProvideDefaultName>
  </TemplateData>
  <TemplateContent>
    <Project File="MvcBoilerplate.csproj" ReplaceParameters="true">
      <ProjectItem ReplaceParameters="true" TargetFileName="Properties%5CAssemblyInfo.cs">AssemblyInfo.cs</ProjectItem>
      <Folder Name="App_Start">
        <ProjectItem ReplaceParameters="true" OpenInEditor="false">BundleConfig.cs</ProjectItem>
        <ProjectItem ReplaceParameters="true" OpenInEditor="false">FilterConfig.cs</ProjectItem>
        <ProjectItem ReplaceParameters="true" OpenInEditor="false">RouteConfig.cs</ProjectItem>
        <ProjectItem ReplaceParameters="true" OpenInEditor="false">Startup.Container.cs</ProjectItem>
      </Folder>
      <!-- Omitted lots of Folder and ProjectItem nodes... -->
      <ProjectItem ReplaceParameters="true" OpenInWebBrowser="true">ReadMe.html</ProjectItem>
    </Project>
  </TemplateContent>
</VSTemplate>
```

The next step is to add a VSIX Project to our solution. This is the project that will actually build a .vsix file.

![The new project dialogue, showing how to create a new VSIX project.](./images/ExportVSIX5.png)
The new project dialogue, showing how to create a new VSIX project.

If you open the `.vsixmanifest` file, you can fill in basic information about the template. This information will be displayed in the 'New Project' dialogue. I have specified an Icon, Preview Image and Licence file. All three of these files are added to the project.

![The metadata for the VSIX project, describing the .vsix installer file and also the project shown in the solution explorer, showing the files included.](./images/ExportVSIX6.png)
The metadata for the VSIX project, describing the .vsix installer file and also the project shown in the solution explorer, showing the files included.

The 'Install Targets' tab lets you target a specific version of Visual Studio. I changed this to support Visual Studio 2012 and above by specifying the version range to be `[11.0,]`. More information [here](http://blogs.msdn.com/b/visualstudio/archive/2013/08/08/update-for-extension-authors-vsix-manifest-version-ranges.aspx).

The 'Dependencies' tab is very similar. Here you can specify which version of the .NET Framework your project depends on. I stuck with the defaults of .NET 4.5 only.

![The installation targets or versions of Visual Studio your VSIX extension will install to.](./images/ExportVSIX7.png)
The installation targets or versions of Visual Studio your VSIX extension will install to.

If you click on the 'Assets' tab on the left, you can add a reference to your other 'C# Project Template' project.

![The VSIX C# projects you want to add to the VSIX extension as an asset to be installed.](./images/ExportVSIX8.png)
The VSIX C# projects you want to add to the VSIX extension as an asset to be installed.

# Submitting your VSIX Project Template to the Visual Studio Gallery

Submitting your new VSIX extension to the Visual Studio Gallery is a great way to share your new Project Template with the world. The [ASP.NET Core Boilerplate](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) extension now has over a hundred downloads within two days of submitting it!

If you've followed the steps above to create a VSIX package and tested that it works correctly then submitting one to the site is really easy. Follow [this](https://visualstudiogallery.msdn.microsoft.com/site/upload/view) link to the submission page and fill in the form. An example of what it looks like can be seen below:

![An example of the Visual Studio Gallery Submission Page.](./images/VisualStudioGallery1.png)
An example of the Visual Studio Gallery Submission Page.

Once you have made your submission and you go to the 'New Project' dialogue, you can go to the 'Online' section and see your project template listed.

![The project template shown in the 'Web' section of Visual Studio's 'New Project' dialogue.](./images/VisualStudioGallery2.png)
The project template shown in the 'Web' section of Visual Studio's 'New Project' dialogue.

If you use the template above, explicitly install it from the Visual Studio Gallery or install it from 'Extensions and Updates', you will then see the project appear in the 'New Project' dialogue under the category you specified in the settings above.

![The project template shown in the 'Online' section of Visual Studio's 'New Project' dialogue.](./images/VisualStudioGallery3.png)
The project template shown in the 'Online' section of Visual Studio's 'New Project' dialogue.

# Conclusions

Creating a simple .zip project template is super simple and something everyone should know and use for larger projects. Creating VSIX project templates is a lot more involved but to be honest, there is no reason why it should be. I hope Microsoft makes this process a lot easier.
