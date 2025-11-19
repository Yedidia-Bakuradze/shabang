from django.http import JsonResponse

# @desc     Health check of the server
# @route    GET /api
# @access   Public
def test(req):
    return JsonResponse({"message":"Server is up!"})