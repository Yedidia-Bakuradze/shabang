from django.shortcuts import render
from rest_framework.views


class ProjectListView(APIView):
    # @desc     Get all user's project
    # @route    GET /api/project
    # @access   Protected
    def get(req):
        # TODO: Waiting for the auth feature to add the token on HTTP request feature
        pass

    # @desc     Create new blank project
    # @route    POST /api/project
    # @access   Protected
    def create(req):
        # TODO: Design the 'project' schema and migrate it into our system before running queries on that model
        pass

    # @desc     Update project
    # @route    PUT /api/project/:id
    # @access   Protected
    def update(req):
        # TODO Same like on 'create_project'
        pass

    # @desc     Delete project
    # @route    DELETE /api/project
    # @access   Protected
    def delete(req):
        # TODO Same like on 'create_project'
        pass