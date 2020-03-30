---
title: ".gitattributes Best Practices"
description: "Best practices for configuring Git in the .gitattributes file. Configuring CRLF and LF line endings. Configuring Git Large File System (LFS) for binary files."
author: "Muhammad Rehan Saeed"
permalink: "/gitattributes-best-practices/"
cover_image: "./images/hero/Git-1366x768.png"
date: "2019-07-22"
published: true
categories:
tags:
  - "Git"
  - "Git LFS"
  - "gitattributes"
  - "GitHub"
  - "gitignore"
---

## .gitignore

If you've messed with Git for long enough, you're aware that you can use the .gitignore file to exclude files from being checked into your repository. There is even a whole [GitHub repository](https://github.com/github/gitignore) with nothing but pre-made `.gitignore` files you can download. If you work with anything vaguely in the Microsoft space with Visual Studio, you probably want the ['Visual Studio' .gitignore file](https://github.com/github/gitignore/blob/master/VisualStudio.gitignore).

## .gitattributes

There is a lesser know [.gitattributes](https://www.git-scm.com/docs/gitattributes) file that can control a bunch of Git settings that you should consider adding to almost **every** repository as a matter of course.

### Line Endings

If you've studied a little computer science, you'll have seen that operating systems use different characters to represent line feeds in text files. Windows uses a Carriage Return (CR) followed by the Line Feed (LF) character, while Unix based operating systems use the Line Feed (LF) alone. All of this has it's origin in typewriters which is pretty amazing given how antiquated they are. I recommend reading the [Newline Wikipedia article](https://en.wikipedia.org/wiki/Newline) for more on the subject.

Newline characters often cause problems in Git when you have developers working on different operating systems (Windows, Mac and Linux). If you've ever seen a phantom file change where there are no visible changes, that could be because the line endings in the file have been changed from CRLF to LF or vice versa.

Git can actually be configured to automatically handle line endings using a setting called [autocrlf](https://help.github.com/en/articles/configuring-git-to-handle-line-endings). This automatically changes the line endings in files depending on the operating system. However, you shouldn't rely on people having correctly configured Git installations. If someone with an incorrect configuration checked in a file, it would not be easily visible in a PR and you'd end up with a repository with inconsistent line endings.

The solution to this is to add a `.gitattributes` file at the root of your repository and set the line endings to be automatically normalised like so:

```git
# Set default behaviour to automatically normalize line endings.
* text=auto

# Force bash scripts to always use lf line endings so that if a repo is accessed
# in Unix via a file share from Windows, the scripts will work.
*.sh text eol=lf
```

The second line is not strictly necessary. It hard codes the line endings for bash scripts to be LF, so that they can be executed via a file share. It's a practice I picked up from the [corefx repository](https://github.com/dotnet/corefx/blob/master/.gitattributes).

### Git Large File System (LFS)

It's pretty common to want to checking binary files into your Git repository. Building a website for example, involves images, fonts, maybe some compressed archives too. The problem with these binary files is that they bloat the repository a fair bit. Every time you check-in a change to a binary file, you've now got both files saved in Git's history. Over time this bloats the repository and makes cloning it slow. A much better solution is to use [Git Large File System (LFS)](https://git-lfs.github.com/). LFS stores binary files in a separate file system. When you clone a repository, you only download the latest copies of the binary files and not every single changed version of them.

LFS is supported by most source control providers like GitHub, Bitbucket and Azure DevOps. It a plugin to Git that has to be separately installed (It's a checkbox in the Git installer) and it even has it's own CLI command 'git lfs' so you can run queries and operations against the files in LFS. You can control which files fall under LFS's remit in the `.gitattributes` file like so:

```git
 # Archives
*.7z filter=lfs diff=lfs merge=lfs -text
*.br filter=lfs diff=lfs merge=lfs -text
*.gz filter=lfs diff=lfs merge=lfs -text
*.tar filter=lfs diff=lfs merge=lfs -text
*.zip filter=lfs diff=lfs merge=lfs -text

# Documents
*.pdf filter=lfs diff=lfs merge=lfs -text

# Images
*.gif filter=lfs diff=lfs merge=lfs -text
*.ico filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.pdf filter=lfs diff=lfs merge=lfs -text
*.png filter=lfs diff=lfs merge=lfs -text
*.psd filter=lfs diff=lfs merge=lfs -text
*.webp filter=lfs diff=lfs merge=lfs -text

# Fonts
*.woff2 filter=lfs diff=lfs merge=lfs -text

# Other
*.exe filter=lfs diff=lfs merge=lfs -text 
```

So here I've added a whole list of file extensions for various file types I want to be controlled by Git LFS. I tell Git that I want to filter, diff and merge using the LFS tool and finally the `-text` argument tells Git that this is not a text file, which is a strange way to tell it that it's a binary file.

A quick warning about adding LFS to an existing repository with existing binary files checked into it. The existing binary files will be checked into Git and not LFS without rewriting Git history which would be bad and you shouldn't do unless you are the only developer. You will have to add a one off commit to take the latest versions of all binary files and add them to LFS. Everyone who uses the repository will also have to re-clone the repository (I found this out the hard way in a team of 15 people. Many apologies were made over the course of a week). Ideally you add this from day one and educate developers about Git's treatment of binary files, so people don't check-in any binary files not controlled by LFS.

### Binary Files

When talking about the `.gitattributes` file, you will quite often hear some people talk about explicitly listing all binary files instead of relying on Git to auto-detect binary files (yes Git is clever enough to do that) like this:

```git
# Denote all files that are truly binary and should not be modified.
*.png binary
*.jpg binary
```

As you saw above, we already do this with Git LFS but if you don't use LFS, read on as you may need to explicitly list binary files in certain rare circumstances.

I was interested so I asked a [StackOverflow question](https://stackoverflow.com/questions/57030698/do-i-really-need-to-specify-all-binary-files-in-gitattributes) and got great answers. If you look at the [Git source code](https://github.com/git/git/blob/9c9b961d7eb15fb583a2a812088713a68a85f1c0/xdiff-interface.c#L187-L193), it checks first 8,000 bytes of a file to see if it contains a NUL character. If it does, the file is assumed to be binary. However, there are cases where you may need to do it explicitly:

- UTF-16 encoded files could be mis-detected as binary.
- Some image format or file that consists only of printable ASCII bytes. This is pretty weird and sounds unlikely to happen.

## Final Form

This is what the final `.gitattributes` file I copy to most repositories looks like:

```git
###############################
# Git Line Endings            #
###############################

# Set default behaviour to automatically normalize line endings.
* text=auto

# Force bash scripts to always use lf line endings so that if a repo is accessed
# in Unix via a file share from Windows, the scripts will work.
*.sh text eol=lf

###############################
# Git Large File System (LFS) #
###############################

# Archives
*.7z filter=lfs diff=lfs merge=lfs -text
*.br filter=lfs diff=lfs merge=lfs -text
*.gz filter=lfs diff=lfs merge=lfs -text
*.tar filter=lfs diff=lfs merge=lfs -text
*.zip filter=lfs diff=lfs merge=lfs -text

# Documents
*.pdf filter=lfs diff=lfs merge=lfs -text

# Images
*.gif filter=lfs diff=lfs merge=lfs -text
*.ico filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.pdf filter=lfs diff=lfs merge=lfs -text
*.png filter=lfs diff=lfs merge=lfs -text
*.psd filter=lfs diff=lfs merge=lfs -text
*.webp filter=lfs diff=lfs merge=lfs -text

# Fonts
*.woff2 filter=lfs diff=lfs merge=lfs -text

# Other
*.exe filter=lfs diff=lfs merge=lfs -text
```

## Conclusions

All of the above are bits and pieces I've put together over time. Are there any other settings that should be considered best practice and added to any `.gitattributes` file?
