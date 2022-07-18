def main(ctx):
    return [
        stepPR("amd64", "weirdradio"),
        stepPR("arm64", "weirdradio"),
        stepMergeMaster("amd64", "weirdradio"),
        stepMergeMaster("arm64", "weirdradio"),
        stepBuildWeekly("amd64", "weirdradio"),
        stepBuildWeekly("arm64", "weirdradio"),

        notify(ctx),
    ]

def notify(ctx):
  return {
        "kind": "pipeline",
        "type": "docker",
        "name": "matrix-notifications",
        "clone": {
            "disable": True,
        },
        "steps": [
          {
              "name": "notify",
              "image": "plugins/matrix",
              "settings": {
                "homeserver": {
                  "from_secret": "matrix-homeserver"
                },
                "roomid": {
                  "from_secret": "matrix-room"
                },
                "username": {
                  "from_secret": "matrix-user"
                },
                "password": {
                  "from_secret": "matrix-password"
                }
              }
            },
        ],
        "depends_on": [ 
                        "docker-build-weirdradio-amd64", 
                        "docker-build-weirdradio-arm64",                 

                        "docker-publish-weirdradio-amd64", 
                        "docker-publish-weirdradio-arm64", 

                        "docker-publish-weekly-weirdradio-amd64", 
                        "docker-publish-weekly-weirdradio-arm64", 
               
                      ],
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/heads/release*",
                "refs/tags/**",
                "refs/pull/**",
            ],
            "status": [
                "failure",
                "success",
            ],
        },
      }

def stepPR(arch, path):
    return {
        "kind": "pipeline",
        "type": "docker",
        "name": "docker-build-%s-%s" % (path, arch),
        "platform": {
            "os": "linux",
            "arch": arch,
        },
        "steps": [
            {
                "name": "build-image-%s-%s" % (path, arch),
                "image": "plugins/docker",
                "settings": {
                    "dockerfile": "Dockerfile",
                    "repo": "dragonchaser/%s" % (path),
                    "dry_run": "true",
                    "tag": "latest-%s" % (arch),
                }
            },
        ],
        "trigger": {
            "ref": [
                "refs/pull/**",
            ],
            "status": [
              "success",
              "failure"
            ]
        },
    }

def stepMergeMaster(arch, path):
    return {
        "kind": "pipeline",
        "type": "docker",
        "name": "docker-publish-%s-%s" % (path, arch),
        "platform": {
            "os": "linux",
            "arch": arch,
        },
        "steps": [
            {
                "name": "build-and-publish-image-%s-%s" % (path, arch),
                "image": "plugins/docker",
                "settings": {
                    "dockerfile": "Dockerfile",
                    "repo": "dragonchaser/%s" % (path),
                    "dry_run": "false",
                    "tag": "latest-%s" % (arch),
                    "username": {
                        "from_secret": "dockerhub-user"
                    },
                    "password": {
                        "from_secret": "dockerhub-password"
                    }
                }
            },
        ],
        "trigger": {
            "ref": [
                "refs/heads/master",
            ],
            "status": [
              "success",
              "failure"
            ]
    }
  }

def stepBuildWeekly(arch, path):
    return {
        "kind": "pipeline",
        "type": "docker",
        "name": "docker-publish-weekly-%s-%s" % (path, arch),
        "platform": {
            "os": "linux",
            "arch": arch,
        },
        "steps": [
            {
                "name": "build-and-publish-image-%s-%s" % (path, arch),
                "image": "plugins/docker",
                "settings": {
                    "dockerfile": "Dockerfile",
                    "repo": "dragonchaser/%s" % (path),
                    "dry_run": "false",
                    "tag": "latest-%s" % (arch),
                    "username": {
                        "from_secret": "dockerhub-user"
                    },
                    "password": {
                        "from_secret": "dockerhub-password"
                    }
                }
            },
        ],
        "trigger": {
            "ref": [
                "refs/heads/master",
            ],
            "event": [
              "cron"
            ],
            "cron": [
              "weekly"
            ]
        },
    }